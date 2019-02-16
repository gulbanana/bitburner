/// <reference path="BitBurner.d.ts" />
import * as format from './lib-format.js';
import { Logger } from './lib-log.js';
import { programs } from './lib-world.js';
import { WorkItem } from './lib-life-L1.js';
import { LifeL2, Faction } from './lib-life-L2.js';

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
        let factions = FactionWithAugs.getAllWithAugs(this.ns);
        this.log.debug(`joined factions: ${factions.map(f => f.name)}`);
        factions = factions.filter(f => f.reputation < f.maxAugRep());
        this.log.debug(`factions with aug reqs not met: ${factions.map(f => f.name)}`);

        if (factions.length > 0) {
            factions.sort((a, b) => a.reputation - b.reputation);
            this.log.debug(`factions sorted by rep: ${factions.map(f => f.name)}`);
            return new WorkItem('faction-' + factions[0].name, () => this.ns.workForFaction(factions[0].name, factions[0].job), true);
        }

        // if all factions are maxed out, buy some of their augs
        this.log.debug(`cash rate: ${format.money(this.cashRate)}/sec`);

        let maxAugCost = this.cashRate * 60 * 60; // an hour's income
        this.log.debug(`max aug cost: ${format.money(maxAugCost)}`);

        // augs we don't already have
        let availableAugs = FactionWithAugs.getAllWithAugs(this.ns)
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

export class FactionWithAugs extends Faction {
    /**
     * @param {string} name
     * @param {number} rep
     * @param {number} fav
     * @param {number} fvg
     * @param {"hacking" | "security"} job
     * @param {Augmentation[]} augs
     */
    constructor(name, rep, fav, fvg, job, augs) {
        super(name, rep, fav, fvg, job)
        this.augmentations = augs;
    }

    maxAugRep() {
        return this.augmentations
            .filter(a => !a.owned)
            .map(a => a.requiredReputation)
            .reduce((a, b) => Math.max(a, b), 0);
    }


    /**
     * @param {IGame} ns
     * @returns FactionWithAugs[]
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
            return new FactionWithAugs(f, rep, fav, fvg, Faction.gangs().includes(f) ? 'security' : 'hacking', augs);
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