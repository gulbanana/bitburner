/// <reference path="BitBurner.d.ts" />
import * as format from './lib-format.js';
import { Logger } from './lib-log.js';
import { Program, Gym, programs, gyms, universities  } from './lib-world.js';

export let TICK_LENGTH =  20; // seconds
let WORK_OVERRIDE_TICKS = 10;
let HACKNET_BUYS_MAX =      10000000000;
let PURCHASED_SERVERS_MIN = 22528000000;
let STOCK_MARKET_MIN =      50000000000;
let DARKWEB_MIN =                200000;
let TRAIN_MIN =                 5000000;
let STAT_GOAL_BASE = 75;

export class LifeL0 {
    /** 
     * @param {IGame} ns 
     * @param {Logger} log
     */
    constructor(ns, log) {
        this.ns = ns;
        this.log = log;
        this.lastEval = ns.getHackingLevel();
        this.lastCash = this.getCash();
        this.beganDH = false;
        this.beganMS = false;
    }

    // singularity functions available with various levels of Source-File 4
    tickDarkwebPurchases() { }
    tickPerformWork() { }
    tickUpgradeHomeSystem() { }
    tickJoinFactions() { }

    async tick() {
        this.cash = this.getCash();
        this.skill = this.ns.getHackingLevel();

        this.tickDarkwebPurchases();
        this.tickUpgradeHomeSystem();
        this.tickJoinFactions();
        await this.tickManageScripts();
        this.tickPerformWork();

        this.lastCash = this.getCash();
    }

    async tickManageScripts() {
        let hasBots = this.ns.getPurchasedServers().length > 0;

        // in the early game, buy a bunch of Hacknet nodes
        if (this.cash < HACKNET_BUYS_MAX) {
            await this.ensureRunning('buy-nodes.js');
        } else if (this.cash >= HACKNET_BUYS_MAX) {
            await this.ensureKilled('buy-nodes.js');
        }

        // before we can afford a server farm, use DH
        if (!this.beganDH || (this.cash < PURCHASED_SERVERS_MIN && !this.beganMS)) {
            if (!this.beganDH) {
                this.log.info('begin distributed-hack architecture');
                this.beganDH = true;
            }

            if (!this.dhRunning()) {
                if (await this.dhStart()) {
                    this.lastEval = this.skill;
                }
            } else if (this.skill / this.lastEval > 1.1) {
                if (await this.dhStop() && await this.dhStart()) {
                    this.lastEval = this.skill;
                }
            }
            
        // once a server farm is available, use MS
        } else {
            if (!this.beganMS) {
                this.log.info('begin mega-server architecture');
                this.beganMS = true;
            }

            // precondition: actually buy the servers
            if (!hasBots) {
                await this.runOnce('buy-servers.js');
            }

            // precondition: shut down DH (also gives time for the server-buy to go through)
            if (this.dhRunning()) {
                await this.dhStop();
            }

            if (!this.msRunning()) {
                if (await this.msStart()) {
                    this.lastEval = this.skill;
                }
            } else if (this.skill / this.lastEval > 1.1) {
                if (await this.msStop() && await this.msStart()) {
                    this.lastEval = this.skill;
                }
            }
        }

        // assume that everyone with enough to buy stock market access has done so
        if (this.cash >= STOCK_MARKET_MIN) {
            await this.ensureRunning('hft.js');
        }

        // use spare ram to farm hacking skill, unless farming it via bots
        if (!hasBots) {
            this.ensureRunning('farm-worker.js', true);
        }
    }

    /********************/
    /* script utilities */
    /********************/

    /**
     * @param {string} script
     * @param {boolean} [maxThreads=false]
     */
    async ensureRunning(script, maxThreads) {
        let threads = 1;
        if (maxThreads) {
            threads = this.getMaxThreads(script);
            if (threads <= 0) return;
        }

        if (!this.ns.scriptRunning(script, 'home')) {
            let threads = 1;
            if (maxThreads) {
                threads = this.getMaxThreads(script);
            }
    
            await this.ns.exec(script, 'home', threads);
            this.log.info(`started ${script} (${threads} threads)`);
        } else {
            let top = this.ns.ps('home');
            let p = top.find(s => s.filename == script);
            if (p.threads != threads) {
                await this.ensureKilled(script);
                await this.ensureRunning(script, maxThreads);
            }
        }
    }

    /**
     * @param {string} script
     */
    async ensureKilled(script) {
        let killed = false;
        while (this.ns.scriptRunning(script, 'home')) {
            if (!killed) {
                killed = this.ns.scriptKill(script, 'home');
                if (killed) {
                    this.log.info('stopped ' + script);
                } else {
                    this.log.error('failed to kill script ' + script + 'on home');
                    return;    
                }
            }

            await this.ns.sleep(1000);
        }
    }
    
    /** @param {string} script */
    async runOnce(script) {
        if (!this.ns.isRunning(script, 'home')) {
            await this.ns.exec(script, 'home', 1);
            this.log.info(`started ${script}`);
        }
    }

    /******************/
    /* info utilities */
    /******************/

    getCash() {
        return this.ns.getServerMoneyAvailable('home');
    }

    getFreeRam() {
        let ram = this.ns.getServerRam('home');
        return ram[0] - ram[1];
    }

    /** @param {string} script */
    getMaxThreads(script) {
        let available = this.getFreeRam() - 32; // keep a bunch for maintenance scripts
        let cost = this.ns.getScriptRam(script, 'home');
        return Math.floor(available / cost);
    }

    /******************************/
    /* hack architecture controls */
    /******************************/
    resetHackEval() {
        this.lastEval = 1;
    }

    dhRunning() {
        return this.ns.scriptRunning('dh-control.js', 'home');
    }
    
    async dhStart() {
        this.log.debug('starting distributed-hack architecture');
        return await this.ns.exec('dh-eval.js', 'home', 1, 'autostart');
    }

    async dhStop() {
        if (this.getFreeRam() < this.ns.getScriptRam('dh-stop.js')) {
            await this.ensureKilled('dh-control.js');
        }

        this.log.debug('stopping distributed-hack architecture');
        return await this.ns.exec('dh-stop.js', 'home', 1);
    }

    msRunning() {
        return this.ns.ps('bot0').length > 0;
    }

    async msStart() {
        this.log.debug('starting mega-server architecture');
        return await this.ns.exec('ms-eval.js', 'home', 1, 'autostart');
    }

    async msStop() {
        this.log.debug('stopping mega-server architecture');
        return await this.ns.exec('ms-stop.js', 'home', 1);
    }
}

export class LifeL1 extends LifeL0 {
    /** 
     * @param {IGame} ns 
     * @param {Logger} log
     */
    constructor(ns, log) {
        super(ns, log);
    }

    tickDarkwebPurchases() {
        // buy darkweb router
        if (this.cash >= DARKWEB_MIN) {
            if (!this.ns.getCharacterInformation().tor) {
                this.log.info(`purchasing TOR router for ${format.money(DARKWEB_MIN)}`);
                this.ns.purchaseTor();
                this.cash = this.getCash();
            }
        }

        // buy darkweb programs (requires router, but it's cheaper than all of them)
        for (var program of programs()) {
            if (!this.hasProgram(program) && this.cash >= program.price) {
                this.log.info(`purchasing ${program.name} for ${format.money(program.price)}`);
                this.ns.purchaseProgram(program.name);
                this.cash = this.getCash();
                this.resetHackEval();
            }
        }
    }

    /** @param {Program} program */
    hasProgram(program) {
        return this.ns.fileExists(program.name, 'home');
    }

    // fullscreen "work" actions
    tickPerformWork() {
        if (this.ns.isBusy() || (this.lastWork && this.lastWork.doWork == null)) {
            if (this.lastWork && !this.countup) {
                if (this.lastWork.isRep) {
                    this.ns.stopAction();
                }

                let workItem = this.selectWork();
                
                if (this.lastWork.name == workItem.name) {
                    this.log.debug(`continue work ${this.lastWork.name}`);
                    if (this.lastWork.isRep) {
                        if (workItem.doWork != null) {
                            workItem.doWork();
                        } 
                    }
                } else {
                    this.log.info(`stop work ${this.lastWork.name}; start work ${workItem.name}`);
                    if (workItem.doWork != null) {
                        workItem.doWork();
                    } 
                }

                this.lastWork = workItem;              
            } else {
                this.log.info('automated work overridden by player, pause indefinitely');
                this.lastWork = null;
            }
        } else {
            if (!this.lastWork && !this.countup) {
                let workItem = this.selectWork();
                this.log.info(`start work ${workItem.name}`);
                if (workItem.doWork != null) {
                    workItem.doWork();
                } 

                this.lastWork = workItem;          
            } else {    
                if (!this.lastWork) {
                    /** @type {number | undefined} */
                    this.countup = 0;
                    this.log.info(`overriden work cancelled by player, pause ${format.time((WORK_OVERRIDE_TICKS - this.countup) * TICK_LENGTH)}`);
                    this.lastWork = new WorkItem('override', null, false);
                } else {
                    this.countup = this.countup || 0;
                    if (this.countup == 0) {
                        this.log.info(`automated work cancelled by player, pause ${format.time((WORK_OVERRIDE_TICKS - this.countup) * TICK_LENGTH)}`);
                    } else {
                        this.log.debug(`automated work cancelled by player, pause ${format.time((WORK_OVERRIDE_TICKS - this.countup) * TICK_LENGTH)}`);
                    }
                }
                
                this.countup = this.countup + 1;
                if (this.countup >= WORK_OVERRIDE_TICKS) {
                    this.log.info(`resume automated work, having waited ${format.time(WORK_OVERRIDE_TICKS * TICK_LENGTH)}`);
                    this.countup = 0;
                    this.lastWork = null;
                }
            }
        }
    }

    selectWork() {
        for (let jobF of [this.workWriteCode, this.workTrainCombatStats, this.workForFactions, this.workTrainCharisma]) {
            let job = jobF.bind(this)();
            if (job != null) return job;
        }

        return new WorkItem('nothing', null, false);
    }

    /** @returns {WorkItem | null} */
    workWriteCode() {
        return null;
    }

    workTrainCombatStats() {
        let info = this.ns.getCharacterInformation();
        let stats = this.ns.getStats();
        
        if (this.cash >= TRAIN_MIN) {
            let statGoals = {};
            for (let stat of ['strength', 'defense', 'dexterity', 'agility']) {
                statGoals[stat] = STAT_GOAL_BASE * info.mult[stat] * info.mult[stat + 'Exp'];
                if (stats[stat] < statGoals[stat]) {
                    this.log.debug(`${stat} ${stats[stat]} < goal ${statGoals[stat]}`);
                    return new WorkItem('train-' + stat, () => {
                        let gym = this.getBestGym();
                        this.ensureCity(info, gym.city);
                        this.ns.gymWorkout(gym.name, stat);
                    }, true);
                }
            }
        }

        return null;
    }

    /** @returns {WorkItem | null} */
    workForFactions() {
        return null;
    }

    workTrainCharisma() {
        let info = this.ns.getCharacterInformation();

        if (this.cash >= TRAIN_MIN) {
            return new WorkItem('university', () => {
                let uni = this.getBestUniversity();
                this.ensureCity(info, uni.city);
                this.ns.universityCourse(uni.name, 'Leadership');
            }, true);
        }

        return null;
    }

    getBestGym() {
        let gs = gyms();
        gs.sort((a, b) => b.price - a.price);
        return gs[0];
    }

    getBestUniversity() {
        let us = universities();
        us.sort((a, b) => b.leadershipPrice - a.leadershipPrice);
        return us[0];
    }
   
    /**
     * @param {ICharacterInfo} info
     * @param {string} name
     */
    ensureCity(info, name) {
        if (info.city != name) {
            if (this.ns.travelToCity(name)) {
                this.log.info('travelled to ' + name);
            } else {
                this.log.error(`travel to ${name} failed`);
            }
        }
    }
}

export class LifeL2 extends LifeL1 {
    /** 
     * @param {IGame} ns 
     * @param {Logger} log
     */
    constructor(ns, log) {
        super(ns, log);
    }

    // persists through aug reset, makes early farming better
    tickUpgradeHomeSystem() {
        while (this.cash >= this.ns.getUpgradeHomeRamCost()) {
            this.log.info(`purchasing home RAM upgrade`);
            this.ns.upgradeHomeRam();
            this.cash = this.getCash();
        }
    }

    tickJoinFactions() {
        for (let invite of this.ns.checkFactionInvitations()) {
            if (!Faction.cities().includes(invite)) {
                this.log.info(`join faction ${invite}`);
                this.ns.joinFaction(invite);
            }
        }
    }

    workForFactions() {
        let factions = Faction.getAll(this.ns);
        this.log.debug(`joined factions: ${factions.map(f => f.name)}`);
        factions = factions.filter(f => f.favor + f.favorGain < 150);
        this.log.debug(`factions with favour < 150: ${factions.map(f => f.name)}`);

        if (factions.length > 0) {
            factions.sort((a, b) => a.reputation - b.reputation);
            this.log.debug(`factions sorted by rep: ${factions.map(f => f.name)}`);
            return new WorkItem('faction-' + factions[0].name, () => this.ns.workForFaction(factions[0].name, factions[0].job), true);
        }

        return null;
    }
}

export class LifeL3 extends LifeL2 {
    /** 
     * @param {IGame} ns 
     * @param {Logger} log
     */
    constructor(ns, log) {
        super(ns, log);
        /** @type {{[key: string]: boolean}} */
        this.hadProgram = {};
        /** @type {string} */
        this.savingForAug = '';
    }

    workWriteCode() {
        for (let program of programs()) {
            if (this.hasProgram(program)) {
                if (!this.hadProgram[program.name]) {
                    this.hadProgram[program.name] = true;
                    this.resetHackEval();
                }    
            }
            else if (program.req <= this.skill)  {
                return new WorkItem('program-' + program.name, () => this.ns.createProgram(program.name), false);
            }
        }

        return null;
    }  

    // L3 override which takes augs into account
    workForFactions() {
        let factions = Faction.getAllWithAugs(this.ns);
        this.log.debug(`joined factions: ${factions.map(f => f.name)}`);
        factions = factions.filter(f => f.reputation < f.maxAugRep());
        this.log.debug(`factions with aug reqs not met: ${factions.map(f => f.name)}`);

        if (factions.length > 0) {
            factions.sort((a, b) => a.reputation - b.reputation);
            this.log.debug(`factions sorted by rep: ${factions.map(f => f.name)}`);
            return new WorkItem('faction-' + factions[0].name, () => this.ns.workForFaction(factions[0].name, factions[0].job), true);
        }

        // if all factions are maxed out, buy some of their augs
        let cashRate = (this.cash - this.lastCash) / TICK_LENGTH;
        this.log.debug(`cash rate: ${format.money(cashRate)}/sec`);

        let maxAugCost = cashRate * 60 * 60; // an hour's income
        this.log.debug(`max aug cost: ${format.money(maxAugCost)}`);

        // augs we don't already have
        let availableAugs = Faction.getAllWithAugs(this.ns)
            .map(f => f.augmentations)
            .reduce((a, b) => a.concat(b), [])
            .filter(a => !a.owned);

        // most expensive augs first, because the price doubles each time
        let affordableAugs = availableAugs
            .filter(a => a.price <= maxAugCost)
            .sort((a, b) => b.price - a.price);

        if (affordableAugs.length > 0) {
            this.log.debug("best affordable aug: " + affordableAugs[0]);
            if (affordableAugs[0].price > this.cash) {
                if (this.savingForAug != affordableAugs[0].name) {
                    this.savingForAug = affordableAugs[0].name;
                    this.log.info(`saving for aug ${affordableAugs[0]}`);
                }
            }

            for (let a of affordableAugs) {
                if (a.price <= this.cash) {
                    if (this.ns.purchaseAugmentation(a.faction, a.name)) {
                        this.log.info(`bought aug ${a}`);
                        this.cash = this.getCash();
                        this.savingForAug = '';
                    } else {
                        this.log.info(`failed to buy aug ${a}`);
                    }
                }
            }
        } 

        return null;
    }
}

export class Faction {
    /**
     * @param {string} name
     * @param {number} rep
     * @param {number} fav
     * @param {number} fvg
     * @param {Augmentation[]} augs
     * @param {"hacking" | "security"} job
     */
    constructor(name, rep, fav, fvg, augs, job) {
        this.name = name;
        this.reputation = rep;
        this.favor = fav;
        this.favorGain = fvg;
        this.augmentations = augs;
        this.job = job;
    }

    maxAugRep() {
        return this.augmentations
            .filter(a => !a.owned)
            .map(a => a.requiredReputation)
            .reduce((a, b) => Math.max(a, b), 0);
    }

    static cities() {
        return ['Sector-12', 'Aevum', 'Chongqing', 'New Tokyo', 'Ishima', 'Volhaven'];
    }

    static gangs() {
        return ['Slum Snakes', 'Tetrads'];
    }

    /**
     * @param {IGame} ns
     * @returns Faction[]
     */
    static getAll(ns) {
        let info = ns.getCharacterInformation();
        return info.factions.map(f => 
        {
            let rep = ns.getFactionRep(f);
            let fav = ns.getFactionFavor(f);
            let fvg = ns.getFactionFavorGain(f);
            return new Faction(f, rep, fav, fvg, [], Faction.gangs().includes(f) ? 'security' : 'hacking');
        });
    }

    /**
     * @param {IGame} ns
     * @returns Faction[]
     */
    static getAllWithAugs(ns) {
        let info = ns.getCharacterInformation();
        let augInfo = ns.getOwnedAugmentations(true);
        return info.factions.map(f => 
        {
            let rep = ns.getFactionRep(f);
            let fav = ns.getFactionFavor(f);
            let fvg = ns.getFactionFavorGain(f);
            let augs = ns.getAugmentationsFromFaction(f).map(a => {
                let [aRep, aPrc] = ns.getAugmentationCost(a);
                let has = augInfo.includes(a);
                return new Augmentation(a, f, aRep, aPrc, has);
            })
            return new Faction(f, rep, fav, fvg, augs, Faction.gangs().includes(f) ? 'security' : 'hacking');
        });
    }
}

export class Augmentation {
    /**
     * @param {string} name
     * @param {string} fac
     * @param {number} rep
     * @param {number} prc
     * @param {boolean} has
     */
    constructor(name, fac, rep, prc, has) {
        this.name = name;
        this.faction = fac;
        this.requiredReputation = rep;
        this.price = prc;
        this.owned = has;
    }

    toString() {
        if (this.owned) {
            return `${this.name} (OWNED)`
        } else {
            return `${this.name} (${format.money(this.price)})`
        }
    }
}

class WorkItem {
    /**
     * @param {string} name
     * @param {() => void | null} doWork
     * @param {boolean} isRep
     */
    constructor(name, doWork, isRep) {
        this.name = name;
        this.doWork = doWork;
        this.isRep = isRep;
    }
}