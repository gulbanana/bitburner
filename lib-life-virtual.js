/// <reference path="Singularity.d.ts" />
import * as format from './lib-format.js';
import { programs } from './lib-servers.js';
import { Logger } from './lib-log.js';
import { Life, TICK_LENGTH } from './lib-life.js';

let DARKWEB_MIN = 200000;
let WORK_OVERRIDE_TICKS = 12;

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

                let workItem = this.selectWork();
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
                let workItem = this.selectWork();
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
                    this.countup = 0;
                    this.lastWork = null;
                }
            }
        }
    }

    /**
     * @returns {WorkItem}
     */
    selectWork() {
        // create programs 
        let skill = this.ns.getHackingLevel();
        for (let program of programs()) {
            if (!this.hasProgram(program) && program.req <= skill)  {
                return new WorkItem(() => this.ns.createProgram(program.name), false);
            }
        }

        // work for factions
        let factions = this.getFactions();
        this.log.debug(`joined factions: ${factions.map(f => f.name)}`);
        factions = factions.filter(f => f.reputation < f.maxAugRep());
        this.log.debug(`factions with aug reqs not met: ${factions.map(f => f.name)}`);

        if (factions.length > 0) {
            factions.sort((a, b) => a.reputation - b.reputation);
            this.log.debug(`factions sorted by rep: ${factions.map(f => f.name)}`);
            return new WorkItem(() => this.ns.workForFaction(factions[0].name, 'hacking'), true);
        }

        return new WorkItem(null, false);
    }

    /**
     * @param {IProgram} program
     */
    hasProgram(program) {
        return this.ns.fileExists(program.name, 'home');
    }

    /**
     * @returns Faction[]
     */
    getFactions() {
        let info = this.ns.getCharacterInformation();
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
            return new Faction(f, rep, fav, fvg, augs);
        });
    }
}

class Faction {
    /**
     * @param {string} name
     * @param {number} rep
     * @param {number} fav
     * @param {number} fvg
     * @param {Augmentation[]} augs
     */
    constructor(name, rep, fav, fvg, augs) {
        this.name = name;
        this.reputation = rep;
        this.favor = fav;
        this.favorGain = fvg;
        this.augmentations = augs;
    }

    maxAugRep() {
        return this.augmentations
            .filter(a => !a.owned)
            .map(a => a.requiredReputation).reduce((a, b) => Math.max(a, b));
    }

    static cities() {
        return ['Sector-12', 'Aevum', 'Chongqing', 'New Tokyo', 'Ishima', 'Volhaven'];
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