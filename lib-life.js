/// <reference path="BitBurner.d.ts" />
import * as format from './lib-format.js';
import { enrol, Program, programs, gyms, universities  } from './lib-world.js';
import { Logger } from './lib-log.js';

const TICK_SECONDS =                    20;
const STOCK_MARKET_MIN =         100000000;
const HACKNET_BUYS_MAX =       10000000000;
const PURCHASED_SERVER_PRICE = 22528000000;
const PURCHASED_SERVER_RAM =         16384;
const WORK_OVERRIDE_TICKS =             10;
const STAT_GOAL_BASE =                  90;
const DARKWEB_MIN =                 200000;
const TRAIN_MIN =                  5000000;
const COMPANY_REP_MAX =             200000;  // level required for most factions
const FAVOUR_MAX =                     150;   // level required for donations
const CITY_MONEY_REQ =            50200000; // volhaven 50m + travel 200k
const DONATE_AMOUNT =        1000000000000;
const TRAVEL_MIN =                  200000;

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

class Faction {
    /**
     * @param {string} name
     * @param {number} rep
     * @param {number} fav
     * @param {number} fvg
     * @param {WorkName | null} job
     * @param {Augmentation[]} augs
     */
    constructor(name, rep, fav, fvg, job, augs) {
        this.name = name;
        this.reputation = rep;
        this.favor = fav;
        this.favorGain = fvg;
        this.job = job;
        this.augmentations = augs;
    }

    static cities() {
        return ['Sector-12', 'Aevum', 'Chongqing', 'New Tokyo', 'Ishima', 'Volhaven'];
    }

    static security() {
        return ['Slum Snakes', 'Tetrads'];
    }

    static gangs() {
        return [
            'Slum Snakes', 'Tetrads', 'The Syndicate', 'The Dark Army', 'Speakers for the Dead',
            'NiteSec', 'The Black Hand'
        ];
    }

    static companies() {
        return Object.getOwnPropertyNames(Company.factions());
    }

    /**
     * @param {IGame} ns
     * @param {string} name
     * @returns Faction
     */
    static get(ns, name) {
        let info = ns.getCharacterInformation();
        let rep = ns.getFactionRep(name);
        let fav = ns.getFactionFavor(name);
        let fvg = ns.getFactionFavorGain(name);
        /** @type {WorkName | null} */
        let job = Faction.security().includes(name) ? 'security' : 'hacking';
        if (info.bitnode == 2 && Faction.gangs().includes(name))
        {
            job = null;
        }
        let augInfo = ns.getOwnedAugmentations(true);
        let augs = ns.getAugmentationsFromFaction(name).map(a => {
            let [aRep, aPrc] = ns.getAugmentationCost(a);
            let has = augInfo.includes(a);
            return new Augmentation(a, name, aRep, aPrc, has);
        })
        return new Faction(name, rep, fav, fvg, job, augs);
    }
    /**
     * @param {IGame} ns
     * @returns Faction[]
     */
    static getAll(ns) {
        let info = ns.getCharacterInformation();
        return info.factions.map(f => Faction.get(ns, f));
    }

    maxAugRep() {
        return this.augmentations
            .filter(a => !a.owned)
            .map(a => a.requiredReputation)
            .reduce((a, b) => Math.max(a, b), 0);
    }

    hasAllAugs() {
        return this.augmentations
        .map(a => a.owned)
        .reduce((a, b) => a && b, true);
    }

    toString() {
        return this.name;
    }
}

class Gang {
    /**
     * @param {string} name
     * @param {number} requiredKarma
     * @param {number} requiredStats
     * @param {string|null} requiredLocation
     */
    constructor(name, requiredKarma, requiredStats, requiredLocation) {
        this.name = name;
        this.requiredKarma = requiredKarma;
        this.requiredStats = requiredStats;
        this.requiredLocation = requiredLocation;
    }

    toString() {
        return this.name;
    }

    static getAll() {
        return [
            new Gang('Slum Snakes', 9, 30, null),
            new Gang('Tetrads', 18, 75, 'Chongqing'),
            new Gang('Speakers for the Dead', 45, 300, null),
            new Gang('The Dark Army', 45, 300, 'Chongqing'),
            new Gang('The Syndicate', 90, 200, 'Sector-12'),
            // no silhouette - special company reqs
        ];
    }
}

class Company {
    /**
     * @param {string} name
     * @param {number} rep
     * @param {number} fav
     * @param {number} fvg
     * @param {string} faction
     * @param {boolean} employed
     */
    constructor(name, rep, fav, fvg, faction, employed) {
        this.name = name;
        this.reputation = rep;
        this.favor = fav;
        this.favorGain = fvg;
        this.faction = faction;
        this.employed = employed;
    }

    toString() {
        return this.name;
    }

    /**
     * @param {IGame} ns
     * @returns Company[]
     */
    static getCurrent(ns) {
        let info = ns.getCharacterInformation();
        let cs = [];
        for (let i = 0; i < info.jobs.length; i++) {
            let c = info.jobs[i];
            let rep = ns.getCompanyRep(c);
            let fav = ns.getCompanyFavor(c);
            let fvg = ns.getCompanyFavorGain(c);
            cs.push(new Company(c, rep, fav, fvg, Company.factions()[c], true));
        }
        return cs;
    }

    /**
     * @param {IGame} ns
     * @returns Company[]
     */
    static getAll(ns) {
        let info = ns.getCharacterInformation();
        let cs = [];
        for (let c of Faction.companies()) {
            let rep = ns.getCompanyRep(c);
            let fav = ns.getCompanyFavor(c);
            let fvg = ns.getCompanyFavorGain(c);
            cs.push(new Company(c, rep, fav, fvg, Company.factions()[c], info.jobs.includes(c)));
        }
        return cs;
    }

    static factions() {
        return {
            'Bachman & Associates': 'Bachman & Associates',
            'ECorp': 'ECorp',
            'MegaCorp': 'MegaCorp',
            'KuaiGong International': 'KuaiGong International',
            'Four Sigma': 'Four Sigma',
            'NWO': 'NWO',
            'Blade Industries': 'Blade Industries',
            'OmniTek Incorporated': 'OmniTek Incorporated',
            'Clarke Incorporated': 'Clarke Incorporated',
            'Fulcrum Technologies': 'Fulcrum Secret Technologies',
        };
    }
}

class Augmentation {
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
        this.lastBots = this.ns.getPurchasedServers().filter(b => this.ns.getServerRam(b)[0] >= PURCHASED_SERVER_RAM).length;
        this.beganMS = this.msRunning();
        this.beganDH = this.beganMS || this.dhRunning();
        this.beganFarm = false;

        // this costs an extra 4.5GB of ram :(
        this.marketAccess = false;
        try
        {
            let symbols = ns.getStockSymbols();
            ns.getStockVolatility(symbols[0]);
            this.marketAccess = true;
        }
        catch (error) { }
        log.debug('market access: ' + this.marketAccess);
    }

    // singularity functions available with various levels of Source-File 4
    tickDarkwebPurchases() { }
    tickPerformWork() { }
    tickUpgradeHomeSystem() { }
    tickAcceptInvites() { }
    tickJoinFactions() { }

    async tick() {
        this.skill = this.ns.getHackingLevel();
        this.cash = this.getCash();
        this.cashRate = (this.cash - this.lastCash) / (this.nextTickLength / 1000);
        this.nextTickLength = TICK_SECONDS * 1000;

        this.tickDarkwebPurchases();
        this.tickUpgradeHomeSystem();
        this.tickAcceptInvites();
        await this.tickManageScripts();
        this.tickPerformWork();

        this.lastCash = this.getCash();
        return this.nextTickLength;
    }

    async tickManageScripts() {
        // in the early game, buy a bunch of Hacknet nodes
        if (this.shouldBuyNodes()) {
            await this.ensureRunning('buy-nodes.js');
        } else {
            await this.ensureKilled('buy-nodes.js');
        }

        // once able to buy good enough servers for MS, switch to buying those
        let bots = this.ns.getPurchasedServers().filter(b => this.ns.getServerRam(b)[0] >= PURCHASED_SERVER_RAM).length;
        let botCost = this.ns.getPurchasedServerCost(PURCHASED_SERVER_RAM);
        let botLimit = this.ns.getPurchasedServerLimit();
        if (this.cash >= botCost && bots < botLimit) {
            this.log.info(`${bots} ${format.ram(PURCHASED_SERVER_RAM)} servers owned; ordering a new one for ${format.money(botCost)}`);
            await this.ns.exec('buy-servers.js', this.ns.getHostname(), 1, [bots+1])
        }

        // before we can afford a server farm, use DH
        if (bots == 0) {
            if (!this.beganDH) {
                this.log.info('begin distributed-hack architecture');
                this.beganDH = true;
            }

            if (!this.dhRunning()) {
                if (await this.dhStart()) {
                    this.lastEval = this.skill;
                }
            } else if (this.skill / this.lastEval > 1.1) {
                await this.dhStop();
                await this.ns.sleep(10 * 1000);
                if (await this.dhStart()) {
                    this.lastEval = this.skill;
                }
            }
            
        // once a server farm is available, use MS
        } else {
            if (!this.beganMS) { // based on an msRunning check, but only once at init startup
                this.log.info('begin mega-server architecture');
                this.beganMS = true;
                if (await this.msStart()) {
                    this.lastEval = this.skill;
                    this.lastBots = bots;
                }
            }

            if (this.skill / this.lastEval > 1.1 || bots > this.lastBots) {
                if (this.skill / this.lastEval > 1.1) {
                    this.log.debug(`skill ${this.skill} / lastEval ${this.lastEval} > 1.1`);
                    await this.msStop();
                    await this.ns.sleep(10 * 1000);    
                }
                
                if (bots > this.lastBots) {
                    this.log.debug(`bots ${bots} > lastBots ${this.lastBots}`);
                }

                if (await this.msStart()) {
                    this.lastEval = this.skill;
                    this.lastBots = bots;
                }
            } 
        }

        // assume that everyone with enough to buy stock market access has done so
        if (this.marketAccess && this.cash >= STOCK_MARKET_MIN) {
            await this.ensureRunning('hft.js');
        }

        // use spare ram to farm hacking skill
        if (this.shouldFarmHackingSkill()) {
            let target = 'foodnstuff';

            if (this.ns.scriptRunning('dh-control.js', this.ns.getHostname())) {
                let top = this.ns.ps(this.ns.getHostname());
                let p = top.find(p => p.filename == 'dh-control.js');
                target = p.args[0];
            } else if (this.ns.scriptRunning('farm-worker.js', this.ns.getHostname())) {
                let top = this.ns.ps(this.ns.getHostname());
                let p = top.find(p => p.filename == 'farm-worker.js');
                target = p.args[0];
            }
            
            if (!this.beganFarm) {
                enrol(this.ns, target);
                this.beganFarm = true;
            }
            
            this.ensureRunningWithArg('farm-worker.js', target, true);
        } else if (this.beganFarm) {
            this.ensureKilled('farm-worker.js');
        }
    }

    /********************/
    /* script utilities */
    /********************/

    /**
     * @param {string} script
     */
    async ensureRunning(script) {
        if (!this.ns.scriptRunning(script, this.ns.getHostname())) {    
            await this.ns.exec(script, this.ns.getHostname(), 1);
            this.log.info(`run ${script} -t ${1}`);
        }
    }

    /**
     * @param {string} script
     * @param {string} arg
     * @param {boolean} [maxThreads]
     */
    async ensureRunningWithArg(script, arg, maxThreads) {
        if (!this.ns.isRunning(script, this.ns.getHostname(), arg)) {   
            // not running with right arg
            if (this.ns.scriptRunning(script, this.ns.getHostname())) { 
                // running with wrong arg
                await this.ensureKilled(script);
            } else {
                // not running at all
                let threads = 1;
                if (maxThreads) {
                    threads = this.getMaxThreads(script);
                    if (threads <= 0) return;
                }
        
                await this.ns.exec(script, this.ns.getHostname(), threads, arg);
                this.log.info(`run ${script} -t ${threads} ${arg}`);
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
        let available = this.getFreeRam() - this.spareRamNeeded(); // keep a bunch for maintenance scripts
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
        let servers = this.ns.getPurchasedServers();
        if (servers.length == 0) return false;
        let server1 = 'bot0'; // servers[0]; - wrong because it changes
        let top = this.ns.ps(server1);
        if (top.length == 0) return false;
        return top[0].filename.startsWith('ms');
    }

    async msStart() {
        this.log.debug('starting mega-server architecture');
        return await this.ns.exec('ms-eval.js', 'home', 1, 'autostart');
    }

    async msStop() {
        this.log.debug('stopping mega-server architecture');
        return await this.ns.exec('ms-stop.js', 'home', 1);
    }
    
    /**********/
    /* POLICY */
    /**********/

    shouldBuyNodes() {
        return this.cash <= HACKNET_BUYS_MAX;
    }

    shouldFarmHackingSkill() {
        return true;
    }

    spareRamNeeded() {
        return 128;
    }
}

export class LifeL1 extends LifeL0 {
    /** 
     * @param {IGame} ns 
     * @param {Logger} log
     */
    constructor(ns, log) {
        super(ns, log);

        /** @type {WorkItem} */
        this.lastWork = null;

        /** @type {{[key: string]: boolean}} */
        this.hadProgram = {};
        for (let program of programs())
        {
            this.hadProgram[program.name] = true;
        }

        /** @type {string} */
        this.savingForAug = '';

        /** @type {number} */
        this.homicides = 0;
        let factions = this.ns.getCharacterInformation().factions;
        for (let gang of Gang.getAll()) {
            if (factions.includes(gang.name)) {
                this.homicides = Math.max(this.homicides, gang.requiredKarma);
            }
        }

        this.log.debug(`assumed starting homicides: ${this.homicides}`);
    }

    /***************************************************************************/
    /* TICK ITEMS - background checks and tasks, each one executed in sequence */
    /***************************************************************************/

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

    // fullscreen "work" actions
    tickPerformWork() {
        // continue automation if:
        // - we're still doing something, or
        // - we deliberately didn't do anything, or
        // - we did something which may have finished early
        if (this.ns.isBusy() || (this.lastWork && (this.lastWork.name == 'nothing' || this.lastWork.name.startsWith('crime')))) {
            // has work been selected, and not overridden (countup>0)?
            if (this.lastWork && !this.countup) {
                if (this.lastWork.isRep) {
                    this.ns.stopAction();
                }

                let workItem = this.selectWork();
                
                // is work actually still ongoing?
                if (this.ns.isBusy() && this.lastWork.name == workItem.name) {
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
                    this.log.info(`overriden work cancelled by player, pause ${format.time((WORK_OVERRIDE_TICKS - this.countup) * TICK_SECONDS)}`);
                    this.lastWork = new WorkItem('override', null, false);
                } else {
                    this.countup = this.countup || 0;
                    if (this.countup == 0) {
                        this.log.info(`automated work cancelled by player, pause ${format.time((WORK_OVERRIDE_TICKS - this.countup) * TICK_SECONDS)}`);
                    } else {
                        this.log.debug(`automated work cancelled by player, pause ${format.time((WORK_OVERRIDE_TICKS - this.countup) * TICK_SECONDS)}`);
                    }
                }
                
                this.countup = this.countup + 1;
                if (this.countup >= WORK_OVERRIDE_TICKS) {
                    this.log.info(`resume automated work, having waited ${format.time(WORK_OVERRIDE_TICKS * TICK_SECONDS)}`);
                    this.countup = 0;
                    this.lastWork = null;
                }
            }
        }
    }

    // persists through aug reset, makes early farming better
    tickUpgradeHomeSystem() {
        while (this.cash >= this.ns.getUpgradeHomeRamCost()) {
            this.log.info(`purchasing home RAM upgrade`);
            this.ns.upgradeHomeRam();
            this.cash = this.getCash();
        }
    }

    tickAcceptInvites() {
        for (let invite of this.ns.checkFactionInvitations()) {
            if (this.shouldAcceptInvite(invite)) {
                this.log.info(`join faction ${invite}`);
                this.ns.joinFaction(invite);
            }
        }
    }

    /*********************************************************/
    /* WORK ITEMS - returns a fullscreen activity definition */
    /*********************************************************/
    selectWork() {
        for (let jobF of [this.workWriteCode, this.workTrainStats, this.workCommitCrimes, this.workJoinCities, this.workForFactions, this.workForCompanies, this.workJoinCompanies]) {
            let job = jobF.bind(this)();
            if (job != null) return job;
        }

        return new WorkItem('nothing', null, false);
    }

    /** @returns {WorkItem | null} */
    workWriteCode() {
        return null;
    }

    workTrainStats() {
        let info = this.ns.getCharacterInformation();
        this.guessCharismaMult(info.mult);

        let stats = this.ns.getStats();
        
        if (this.cash >= TRAIN_MIN) {
            let statGoals = {};
            for (let stat of ['strength', 'defense', 'dexterity', 'agility', 'charisma']) {
                statGoals[stat] = STAT_GOAL_BASE * info.mult[stat]; // * info.mult[stat + 'Exp']; - reciprocal effect only
                
                if (stats[stat] < statGoals[stat]) {
                    this.log.debug(`${stat} ${stats[stat]} < goal ${statGoals[stat]}`);
                    return new WorkItem('train-' + stat, () => {
                        if (stat == 'charisma') {
                            let uni = this.getBestUniversity();
                            this.ensureCity(info, uni.city);
                            this.ns.universityCourse(uni.name, 'Leadership');            
                        } else {
                            let gym = this.getBestGym();
                            this.ensureCity(info, gym.city);
                            this.ns.gymWorkout(gym.name, stat);
                        }
                    }, false);
                }
            }
            this.log.debug(`stat goals reached - ${JSON.stringify(statGoals)}`);
        }

        return null;
    }

    workForFactions() {
        let factions = Faction.getAll(this.ns).filter(f => f.job != null);
        this.log.debug(`workable factions: ${factions.map(f => f.name)}`);
        
        factions = factions.filter(f => f.reputation < f.maxAugRep());
        this.log.debug(`factions with aug reqs not met: ${factions.map(f => f.name)}`);
        let allReqsMet = factions.length == 0;

        factions = factions.filter(f => f.favor + f.favorGain < FAVOUR_MAX);
        this.log.debug(`factions with favour < ${FAVOUR_MAX}: ${factions.map(f => f.name)}`);
        let reqsCouldBeMetAfterDonations = factions.length == 0 && !allReqsMet;

        if (factions.length > 0) {
            factions.sort((a, b) => a.reputation - b.reputation);
            this.log.debug(`factions sorted by rep: ${factions.map(f => f.name)}`);
            return new WorkItem('faction-' + factions[0].name, () => this.ns.workForFaction(factions[0].name, factions[0].job), true);
        }

        if (reqsCouldBeMetAfterDonations && this.cash >= DONATE_AMOUNT) {
            for (let f of Faction.getAll(this.ns)) {
                if (f.favor >= FAVOUR_MAX && f.maxAugRep() > f.reputation) {
                    if (this.ns.donateToFaction(f.name, DONATE_AMOUNT)) {
                        this.log.info(`donated ${format.money(DONATE_AMOUNT)} to faction ${f}`);
                        this.cash = this.getCash();
                        if (this.cash < DONATE_AMOUNT) {
                            break;
                        }
                    } else {
                        this.log.error(`failed to donate to faction ${f}`);
                        break;
                    }
                }
            }

            allReqsMet = Faction.getAll(this.ns).filter(f => f.maxAugRep() > f.reputation).length == 0;
        }

        // if all factions are maxed out, buy some of their augs
        if (allReqsMet) {
            this.log.debug(`cash rate: ${format.money(this.cashRate)}/sec`);

            let maxAugCost = this.cashRate * 60 * 60; // an hour's income
            this.log.debug(`max aug cost: ${format.money(maxAugCost)}`);

            // augs we don't already have
            let availableAugs = Faction.getAll(this.ns)
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
        }

        return null;
    }

    /** @returns {WorkItem | null} */
    workForCompanies() {
        return null;
    }

    /** @returns {WorkItem | null} */
    workCommitCrimes() {
        return null;
    }

    /** @returns {WorkItem | null} */
    workJoinCities() {        
        return null;
    }

    /** @returns {WorkItem | null} */
    workJoinCompanies() {
        return null;
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

    /*********************/
    /* misc info lookups */
    /*********************/

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

    /** @param {ICharacterInfoMultipliers} mult */
    guessCharismaMult(mult) {
        // start with SF1-3 and SF2-1
        let stat = 1.28 * 1.24;
        let statExp = 1.28;

        let augs = this.ns.getOwnedAugmentations();        
        if (augs.includes("NeuroFlux Governor")) {
            let level = augs.length / 2; // XXX 
            for (let i = 0; i < level; i++) {
                stat = stat * 1.01;
                statExp = statExp * 1.01;
            }
        }
        if (augs.includes("FocusWire")) { 
            statExp = statExp * 1.05;
        }
        if (augs.includes("Neurotrainer I")) { 
            statExp = statExp * 1.1;
        }   
        if (augs.includes("Neurotrainer II")) { 
            statExp = statExp * 1.15;
        }
        if (augs.includes("Power Recirculation Core")) { 
            stat = stat * 1.05;
            statExp = statExp * 1.1;
        }
        if (augs.includes("Speech Enhancement")) { 
            stat = stat * 1.1;
        }
        if (augs.includes("Speech Processor Implant")) { 
            stat = stat * 1.2;
        }
        if (augs.includes("Enhanced Social Interaction Implant")) {
            stat = stat * 1.6;
            statExp = statExp * 1.6;
        }
        if (augs.includes("SmartJaw")) {
            stat = stat * 1.5;
            statExp = statExp * 1.5;
        }
        if (augs.includes("Xanipher")) {
            stat = stat * 1.2;
            statExp = statExp * 1.15;
        }
        if (augs.includes("nextSENS Gene Modification")) {
            stat = stat * 1.2;
        }
        if (augs.includes("TITN-41 Gene-Modification Injection")) {
            stat = stat * 1.15;
            statExp = stat * 1.15;
        }

        mult.charisma = stat;
        mult.charismaExp = statExp;
    }

    /** @param {Program} program */
    hasProgram(program) {
        return this.ns.fileExists(program.name, 'home');
    }

    /*******************/
    /* POLICY SETTINGS */
    /*******************/

    /** @param {string} faction */
    shouldAcceptInvite(faction) {
        return !Faction.cities().includes(faction) || !Faction.get(this.ns, faction).hasAllAugs();
    }

    shouldBuyNodes() {
        // return this.cash <= HACKNET_BUYS_MAX;
        return this.ns.getCharacterInformation().bitnode != 4;
    }

    shouldCommitCrimes() {
        return this.cash >= TRAIN_MIN && this.ns.getCharacterInformation().bitnode == 2;
    }

    // uses home server to weaken DH target
    shouldFarmHackingSkill() {
        return true;
    }

    spareRamNeeded() {
        return this.ns.getCharacterInformation().bitnode == 4 ? 64 : 128;
    }
}

export class Life extends LifeL1 {
    /** 
     * @param {IGame} ns 
     * @param {Logger} log
     */
    constructor(ns, log) {
        super(ns, log);
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

    /** @returns {WorkItem | null} */
    workJoinCities() {
        if (this.cash < CITY_MONEY_REQ) {
            return;
        }

        let info = this.ns.getCharacterInformation();
        let joins = info.factions;
        let invites = this.ns.checkFactionInvitations();

        /** @type {{[key: string]: string[]}} */
        let preclusions = {
            'Sector-12': ['Chongqing', 'New Tokyo', 'Ishima', 'Volhaven'], 
            'Aevum':     ['Chongqing', 'New Tokyo', 'Ishima', 'Volhaven'], 
            'Chongqing': ['Sector-12', 'Aevum', 'Volhaven'], 
            'New Tokyo': ['Sector-12', 'Aevum', 'Volhaven'], 
            'Ishima':    ['Sector-12', 'Aevum', 'Volhaven'], 
            'Volhaven':  ['Sector-12', 'Aevum', 'Chongqing', 'New Tokyo', 'Ishima']
        };

        for (let city of Faction.cities()) {
            if (info.city != city &&
                !joins.includes(city) && 
                !invites.includes(city) && 
                !preclusions[city].map(joins.includes.bind(joins)).reduce((a, b) => a || b, false)) {
                    this.log.info(`Travelling to ${city} for a faction invite.`);
                    this.ns.travelToCity(city);
                    return null;
            }
        }

        let joinedCities = Faction.getAll(this.ns).filter(f => Faction.cities().includes(f.name));
        return null;
    }

    /** @returns {WorkItem | null} */
    workJoinCompanies() {
        // when we've run out of work to do, take another job
        let companies = Company.getAll(this.ns).filter(c => !c.employed);
        if (companies.length > 0) {
            if (this.ns.applyToCompany(companies[0].name, 'software')) {
                this.log.info(`now employed by ${companies[0]}`);
            } else {
                this.log.error(`rejected by ${companies[0]}`);
            }
        }

        return null;
    }

    /** @returns {WorkItem | null} */
    workForCompanies() {
        let info = this.ns.getCharacterInformation();

        let companies = Company.getCurrent(this.ns);
        this.log.debug(`current companies: ${companies}`);

        companies = companies.filter(c => !info.factions.includes(c.faction));
        this.log.debug(`companies without faction membership: ${companies}`);

        companies = companies.filter(c => c.reputation < COMPANY_REP_MAX);
        this.log.debug(`companies with reputation < ${COMPANY_REP_MAX}: ${companies}`);

        if (companies.length > 0) {
            companies.sort((a, b) => a.reputation - b.reputation);
            this.log.debug(`companies sorted by rep: ${companies}`);

            let c = companies[0].name;
            return new WorkItem('company-' + c, () => {
                if (this.lastWork && this.lastWork.name == 'company-' + c) {
                    this.log.debug(`already working for ${c}`);
                    if (this.ns.applyToCompany(c, 'software')) {
                        this.log.info(`promoted by ${c}`);
                    }
                    this.ns.workForCompany();
                } else {
                    this.log.debug(`not currently working for ${c}`);
                    this.ns.applyToCompany(c, 'software');
                    if (!this.ns.workForCompany()) {
                        this.log.error(`rejected by ${c}`);
                    }
                }
            }, true);
        }

        return null;
    }

    /** @returns {WorkItem | null} */
    workCommitCrimes() {
        if (!this.shouldCommitCrimes()) {
            return null;
        }

        let info = this.ns.getCharacterInformation();
        let stats = this.ns.getStats();

        let gangs = Gang.getAll().filter(g => !info.factions.includes(g.name)).sort((a, b) => a.requiredKarma - b.requiredKarma);
        this.log.debug(`unjoined gangs: ${gangs}`);

        if (gangs.length > 0) {
            gangs = gangs.filter(g => g.requiredStats <= Math.min(stats.agility, stats.defense, stats.dexterity, stats.strength));
            this.log.debug(`gangs with high enough combat stats: ${gangs}`);
        }

        if (gangs.length > 0) {
            gangs = gangs.filter(g => g.requiredKarma > this.homicides);
            this.log.debug(`gangs needing lower karma: ${gangs}`);
        }
        
        for (let gang of gangs) {
            if (gang.requiredLocation == null || this.cash >= TRAVEL_MIN) {
                return new WorkItem('crime-homicide', () => {
                    if (gang.requiredLocation != null) {
                        this.ensureCity(this.ns.getCharacterInformation(), gang.requiredLocation);
                    }

                    this.nextTickLength = this.ns.commitCrime('homicide') + 1000;
                }, false);
            }
        }

        return null;
    }
}