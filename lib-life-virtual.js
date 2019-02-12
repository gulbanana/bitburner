/// <reference path="Singularity.d.ts" />
import * as format from './lib-format.js';
import { Program, Gym, programs, gyms, universities  } from './lib-servers.js';
import { Logger } from './lib-log.js';
import { Life, TICK_LENGTH } from './lib-life.js';

let WORK_OVERRIDE_TICKS = 12;
let DARKWEB_MIN = 200000;
let WORKOUT_MIN = 5000000;
let STAT_GOAL_BASE = 50;

export class VirtualLife extends Life {
    /** 
     * @param {IGame} ns 
     * @param {Logger} log
     */
    constructor(ns, log) {
        super(ns, log);
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
                this.log.debug('reevaluate current work');
                if (this.lastWork.isRep) {
                    this.ns.stopAction();
                }

                let workItem = this.selectWork(cash);
                if (workItem.doWork != null) {
                    workItem.doWork();
                } 

                this.lastWork = workItem;              
            } else {
                this.log.debug('work overridden by player, leave it alone indefinitely');
                this.lastWork = null;
            }
        } else {
            if (!this.lastWork && !this.countup) {
                this.log.debug('begin new work');
                let workItem = this.selectWork(cash);
                if (workItem.doWork != null) {
                    workItem.doWork();
                } 

                this.lastWork = workItem;          
            } else {    
                if (!this.lastWork) {
                    this.countup = 0;
                    this.log.debug(`overriden work cancelled by player, leave it alone for ${format.time((WORK_OVERRIDE_TICKS - this.countup) * TICK_LENGTH)}`);
                } else {
                    this.countup = this.countup || 0;
                    this.log.debug(`automated work cancelled by player, leave it alone for ${format.time((WORK_OVERRIDE_TICKS - this.countup) * TICK_LENGTH)}`);
                }
                
                this.countup = this.countup + 1;
                if (this.countup > WORK_OVERRIDE_TICKS) {
                    this.log.debug(`resume new work, having waited ${format.time(WORK_OVERRIDE_TICKS * TICK_LENGTH)}`);
                    this.countup = 0;
                    this.lastWork = null;
                }
            }
        }
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
                return new WorkItem(() => this.ns.createProgram(program.name), false);
            }
        }

        // improve stats
        if (cash >= WORKOUT_MIN) {
            let statGoals = {};
            for (let stat of ['strength', 'defense', 'dexterity', 'agility']) {
                statGoals[stat] = STAT_GOAL_BASE * info.mult[stat] * info.mult[stat + 'Exp'];
                if (stats[stat] < statGoals[stat]) {
                    this.log.debug(`${stat} ${stats[stat]} < goal ${statGoals[stat]}`);
                    return new WorkItem(() => {
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
            return new WorkItem(() => this.ns.workForFaction(factions[0].name, factions[0].job), true);
        }

        // if there's nothing else to do, improve cha
        return new WorkItem(() => {
            let uni = this.getBestUniversity();
            this.ensureCity(info, uni.city);
            this.ns.universityCourse(uni.name, 'Leadership');
        }, true);

        return new WorkItem(null, false);
    }

    /**
     * @param {Program} program
     */
    hasProgram(program) {
        return this.ns.fileExists(program.name, 'home');
    }

    /**
     * @returns Faction[]
     * @param {ICharacterInfo} [info]
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
                return new Augmentation(a, aRep, aPrc, has);
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
            .map(a => a.requiredReputation).reduce((a, b) => Math.max(a, b));
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
     * @param {number} rep
     * @param {number} prc
     */
    constructor(name, rep, prc, has) {
        this.name = name;
        this.requiredReputation = rep;
        this.price = prc;
        this.owned = has;
    }
}

class WorkItem {
    /**
     * @param {() => void | null} doWork
     * @param {boolean} isRep
     */
    constructor(doWork, isRep) {
        this.doWork = doWork;
        this.isRep = isRep;
    }
}