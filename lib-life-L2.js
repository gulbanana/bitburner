/// <reference path="BitBurner.d.ts" />
import { Logger } from './lib-log.js';
import { LifeL1, WorkItem } from './lib-life-L1.js';

const COMPANY_REP_MAX = 200000;  // level required for most factions
export const FAVOUR_MAX = 150;   // level required for donations
const CITY_MONEY_REQ = 50200000; // volhaven 50m + travel 200k

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

    tickAcceptInvites() {
        for (let invite of this.ns.checkFactionInvitations()) {
            if (this.shouldAcceptInvite(invite)) {
                this.log.info(`join faction ${invite}`);
                this.ns.joinFaction(invite);
            }
        }
    }

    /** @param {string} faction */
    shouldAcceptInvite(faction) {
        return !Faction.cities().includes(faction);
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

        let joinedCities = Faction.getCurrent(this.ns).filter(f => Faction.cities().includes(f.name));
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

    workForFactions() {
        let factions = Faction.getCurrent(this.ns);
        this.log.debug(`current factions: ${factions.map(f => f.name)}`);
        
        factions = factions.filter(f => f.favor + f.favorGain < FAVOUR_MAX);
        this.log.debug(`factions with favour < ${FAVOUR_MAX}: ${factions.map(f => f.name)}`);

        if (factions.length > 0) {
            factions.sort((a, b) => a.reputation - b.reputation);
            this.log.debug(`factions sorted by rep: ${factions.map(f => f.name)}`);
            return new WorkItem('faction-' + factions[0].name, () => {
                this.ns.workForFaction(factions[0].name, factions[0].job)
            }, true);
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
     * @param {WorkName | null} job
     */
    constructor(name, rep, fav, fvg, job) {
        this.name = name;
        this.reputation = rep;
        this.favor = fav;
        this.favorGain = fvg;
        this.job = job;
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
        return Object.getOwnPropertyNames(companyFactions);
    }

    /**
     * @param {IGame} ns
     * @param {string} name
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
            return new Faction(name, rep, fav, fvg, job);
    }

    /**
     * @param {IGame} ns
     * @returns Faction[]
     */
    static getCurrent(ns) {
        let info = ns.getCharacterInformation();
        return info.factions.map(f => Faction.get(ns, f));
    }
}

/** @type {{[key: string]: string}} */
let companyFactions = {
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
            cs.push(new Company(c, rep, fav, fvg, companyFactions[c], true));
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
            cs.push(new Company(c, rep, fav, fvg, companyFactions[c], info.jobs.includes(c)));
        }
        return cs;
    }
}
