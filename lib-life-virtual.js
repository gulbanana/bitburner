/// <reference path="Singularity.d.ts" />
import * as format from './lib-format.js';
import { Program, Gym, programs, gyms, universities  } from './lib-world.js';
import { Logger } from './lib-log.js';
import { Life, TICK_LENGTH } from './lib-life.js';

let WORK_OVERRIDE_TICKS = 10;
let DARKWEB_MIN = 200000;
let TRAIN_MIN = 5000000;
let STAT_GOAL_BASE = 75;

export class VirtualLife extends Life {
    /** 
     * @param {IGame} ns 
     * @param {Logger} log
     */
    constructor(ns, log) {
        super(ns, log);
        this.lastCash = this.getCash();
    }

    // singularity-only life automation functions
    async tick() {
        let cash = this.getCash();

        // purchase: darkweb router
        if (cash >= DARKWEB_MIN) {
            if (!this.ns.getCharacterInformation().tor) {
                this.log.info(`purchasing TOR router for ${format.money(DARKWEB_MIN)}`);
                this.ns.purchaseTor();
                cash = this.getCash();
            }
        }

        // purchase: darkweb programs (requires router, but it's cheaper than all of them)
        for (var program of programs()) {
            if (!this.hasProgram(program) && cash >= program.price) {
                this.log.info(`purchasing ${program.name} for ${format.money(program.price)}`);
                this.ns.purchaseProgram(program.name);
                cash = this.getCash();
                this.lastEval = 1;
            }
        }

        // purchase: home computer upgrades - persists through aug reset, makes early farming better
        while (cash >= this.ns.getUpgradeHomeRamCost()) {
            this.log.info(`purchasing home RAM upgrade`);
            this.ns.upgradeHomeRam();
            cash = this.getCash();
        }

        await super.tick();

        for (let invite of this.ns.checkFactionInvitations()) {
            if (!Faction.cities().includes(invite)) {
                this.log.info(`join faction ${invite}`);
                this.ns.joinFaction(invite);
            }
        }

        // determine whether to issue fullscreen "work" actions
        if (this.ns.isBusy()) {
            if (this.lastWork && !this.countup) {
                if (this.lastWork.isRep) {
                    this.ns.stopAction();
                }

                let workItem = this.selectWork(cash);
                
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
                let workItem = this.selectWork(cash);
                this.log.info(`start work ${workItem.name}`);
                if (workItem.doWork != null) {
                    workItem.doWork();
                } 

                this.lastWork = workItem;          
            } else {    
                if (!this.lastWork) {
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
                if (this.countup > WORK_OVERRIDE_TICKS) {
                    this.log.info(`resume automated work, having waited ${format.time(WORK_OVERRIDE_TICKS * TICK_LENGTH)}`);
                    this.countup = 0;
                    this.lastWork = null;
                    await this.tick();
                }
            }
        }

        this.lastCash = this.getCash();
    }

    /**
     * @returns {WorkItem}
     * @param {number} cash
     */
    selectWork(cash) {
        let info = this.ns.getCharacterInformation();
        let stats = this.ns.getStats();
        let skill = stats.hacking;

        // create programs      
        for (let program of programs()) {
            if (!this.hasProgram(program) && program.req <= skill)  {
                return new WorkItem('program-' + program.name, () => this.ns.createProgram(program.name), false);
            }
        }

        // improve stats
        if (cash >= TRAIN_MIN) {
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
        
        // work for factions
        let factions = this.getFactions(info);
        this.log.debug(`joined factions: ${factions.map(f => f.name)}`);
        factions = factions.filter(f => f.reputation < f.maxAugRep());
        this.log.debug(`factions with aug reqs not met: ${factions.map(f => f.name)}`);

        if (factions.length > 0) {
            factions.sort((a, b) => a.reputation - b.reputation);
            this.log.debug(`factions sorted by rep: ${factions.map(f => f.name)}`);
            return new WorkItem('faction-' + factions[0].name, () => this.ns.workForFaction(factions[0].name, factions[0].job), true);
        }

        // if all factions are maxed out, buy some of their augs
        let cashRate = (cash - this.lastCash) / TICK_LENGTH;
        this.log.debug(`cash rate: ${format.money(cashRate)}/sec`);

        let maxAugCost = cashRate * 60 * 60; // an hour's income
        this.log.debug(`max aug cost: ${format.money(maxAugCost)}`);

        // augs we don't already have
        let availableAugs = this.getFactions(info)
            .map(f => f.augmentations)
            .reduce((a, b) => a.concat(b), [])
            .filter(a => !a.owned);

        // most expensive augs first, because the price doubles each time
        let affordableAugs = availableAugs
            .filter(a => a.price <= maxAugCost)
            .sort((a, b) => b.price - a.price);

        if (affordableAugs.length > 0) {
            this.log.debug("best affordable aug: " + affordableAugs[0]);
            for (let a of affordableAugs) {
                if (a.price <= cash) {
                    if (this.ns.purchaseAugmentation(a.faction, a.name)) {
                        this.log.info(`bought aug ${a}`);
                        cash = this.getCash();
                    } else {
                        this.log.info(`failed to buy aug ${a}`);
                    }
                }
            }
        }        

        // if there's nothing else to do, improve cha
        if (cash >= TRAIN_MIN) {
            return new WorkItem('university', () => {
                let uni = this.getBestUniversity();
                this.ensureCity(info, uni.city);
                this.ns.universityCourse(uni.name, 'Leadership');
            }, true);
        }

        return new WorkItem('nothing', null, false);
    }

    /**
     * @param {Program} program
     */
    hasProgram(program) {
        return this.ns.fileExists(program.name, 'home');
    }

    /**
     * @returns Faction[]
     * @param {ICharacterInfo} info
     */
    getFactions(info) {
        let augInfo = this.ns.getOwnedAugmentations(true);
        return info.factions.map(f => 
        {
            let rep = this.ns.getFactionRep(f);
            let fav = this.ns.getFactionFavor(f);
            let fvg = this.ns.getFactionFavorGain(f);
            let augs = this.ns.getAugmentationsFromFaction(f).map(a => {
                let [aRep, aPrc] = this.ns.getAugmentationCost(a);
                let has = augInfo.includes(a);
                return new Augmentation(a, f, aRep, aPrc, has);
            })
            return new Faction(f, rep, fav, fvg, augs, Faction.gangs().includes(f) ? 'security' : 'hacking');
        });
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

class Faction {
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