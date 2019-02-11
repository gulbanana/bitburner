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

    async tick() {
        let cash = this.getCash();

        if (cash >= DARKWEB_MIN) {
            if (!this.ns.getCharacterInformation().tor) {
                this.log.info(`purchasing TOR router for ${format.money(DARKWEB_MIN)}`);
                this.ns.purchaseTor();
                cash = this.getCash();
            }
        }

        for (var program of programs()) {
            if (!this.ns.fileExists(program.name, 'home') && cash >= program.price) {
                this.log.info(`purchasing ${program.name} for ${format.money(program.price)}`);
                this.ns.purchaseProgram(program.name);
                cash = this.getCash();
                this.lastEval = 1;
            }
        }

        await super.tick();
    }
}