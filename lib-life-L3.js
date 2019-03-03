/// <reference path="BitBurner.d.ts" />
import * as format from './lib-format.js';
import { Logger } from './lib-log.js';
import { programs } from './lib-world.js';
import { WorkItem } from './lib-life-L1.js';
import { LifeL2, Faction, FAVOUR_MAX } from './lib-life-L2.js';

const DONATE_AMOUNT = 1000000000000;
const TRAVEL_MIN =           200000;

export class LifeL3 extends LifeL2 {
    /** 
     * @param {IGame} ns 
     * @param {Logger} log
     */
    constructor(ns, log) {
        super(ns, log);
        
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

    /** @param {string} faction */
    shouldAcceptInvite(faction) {
        return !Faction.cities().includes(faction) || !FactionWithAugs.get(this.ns, faction).hasAllAugs();
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
        let factions = FactionWithAugs.getAll(this.ns);
        this.log.debug(`joined factions: ${factions.map(f => f.name)}`);
        
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
            for (let f of FactionWithAugs.getAll(this.ns)) {
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

            allReqsMet = FactionWithAugs.getAll(this.ns).filter(f => f.maxAugRep() > f.reputation).length == 0;
        }

        // if all factions are maxed out, buy some of their augs
        if (allReqsMet) {
            this.log.debug(`cash rate: ${format.money(this.cashRate)}/sec`);

            let maxAugCost = this.cashRate * 60 * 60; // an hour's income
            this.log.debug(`max aug cost: ${format.money(maxAugCost)}`);

            // augs we don't already have
            let availableAugs = FactionWithAugs.getAll(this.ns)
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

    /** @param {ICharacterInfoMultipliers} mult */
    guessCharismaMult(mult) {
        // start with SF1-1
        let stat = 1.16; 
        let statExp = 1.16;

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

        mult.charisma = stat;
        mult.charismaExp = statExp;
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

    hasAllAugs() {
        return this.augmentations
        .map(a => a.owned)
        .reduce((a, b) => a && b, true);
    }

    toString() {
        return this.name;
    }

    /**
     * @param {IGame} ns
     * @returns FactionWithAugs[]
     */
    static getAll(ns) {
        let info = ns.getCharacterInformation();
        return info.factions.map(f => FactionWithAugs.get(ns, f));
    }

    /**
     * @param {IGame} ns
     * @param {string} f
     * @returns FactionWithAugs
     */
    static get(ns, f) {
        let rep = ns.getFactionRep(f);
        let fav = ns.getFactionFavor(f);
        let fvg = ns.getFactionFavorGain(f);
        let augInfo = ns.getOwnedAugmentations(true);
        let augs = ns.getAugmentationsFromFaction(f).map(a => {
            let [aRep, aPrc] = ns.getAugmentationCost(a);
            let has = augInfo.includes(a);
            return new Augmentation(a, f, aRep, aPrc, has);
        })
        return new FactionWithAugs(f, rep, fav, fvg, Faction.gangs().includes(f) ? 'security' : 'hacking', augs);
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

export class Gang {
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