/// <reference path="BitBurner.d.ts" />
import * as format from './lib-format.js';
import { Logger } from './lib-log.js';
import { Program, programs, gyms, universities  } from './lib-world.js';
import { TICK_SECONDS, LifeL0 } from './lib-life-L0.js';

const WORK_OVERRIDE_TICKS =  9;
const STAT_GOAL_BASE =     100;
const DARKWEB_MIN =     200000;
const TRAIN_MIN =      5000000;

export class LifeL1 extends LifeL0 {
    /** 
     * @param {IGame} ns 
     * @param {Logger} log
     */
    constructor(ns, log) {
        super(ns, log);
        /** @type {WorkItem} */
        this.lastWork = null;
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

    selectWork() {
        for (let jobF of [this.workWriteCode, this.workTrainStats, this.workCommitCrimes, this.workForFactions, this.workForCompanies, this.workJoinCompanies]) {
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

    /** @param {ICharacterInfoMultipliers} mult */
    guessCharismaMult(mult) {
        mult.charisma = Math.min(mult.agility, mult.defense, mult.dexterity, mult.agility);
        mult.charismaExp = Math.min(mult.agilityExp, mult.defenseExp, mult.dexterityExp, mult.agilityExp);
    }

    /** @returns {WorkItem | null} */
    workForFactions() {
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
    workJoinCompanies() {
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

    /**********/
    /* policy */
    /**********/

    shouldBuyNodes() {
        return this.ns.getCharacterInformation().bitnode != 4;
    }
}

export class WorkItem {
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