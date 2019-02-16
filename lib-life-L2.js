/// <reference path="BitBurner.d.ts" />
import { Logger } from './lib-log.js';
import { LifeL1, WorkItem } from './lib-life-L1.js';

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

export class Faction {
    /**
     * @param {string} name
     * @param {number} rep
     * @param {number} fav
     * @param {number} fvg
     * @param {"hacking" | "security"} job
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
            return new Faction(f, rep, fav, fvg, Faction.gangs().includes(f) ? 'security' : 'hacking');
        });
    }
}