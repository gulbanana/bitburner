/// <reference path="Singularity.d.ts" />
import * as format from './lib-format.js';
import { programs } from './lib-servers.js';
import { Logger } from './lib-log.js';
import { Life } from './lib-life.js';

let DARKWEB_MIN = 200000;

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

        // fullscreen "work" actions, prioritised
        let workItem = this.selectWork();
        workItem();
    }

    /**
     * @returns {() => void}
     */
    selectWork() {
        let skill = this.ns.getHackingLevel();
        for (let program of programs()) {
            if (!this.hasProgram(program) && program.req <= skill)  {
                return this.ns.createProgram.bind(program.name);
            }
        }

        return () => {};
    }

    /**
     * @param {IProgram} program
     */
    hasProgram(program) {
        return this.ns.fileExists(program.name, 'home');
    }
}