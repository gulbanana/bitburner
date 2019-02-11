/// <reference path="Singularity.d.ts" />
import * as format from './lib-format.js';
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

        for (var program of this.allPrograms()) {
            if (!this.ns.fileExists(program.name, 'home') && cash >= program.price) {
                this.log.info(`purchasing ${program.name} for ${format.money(program.price)}`);
                this.ns.purchaseProgram(program.name);
                cash = this.getCash();
            }
        }

        await super.tick();
    }

    /**
     * @returns {IProgram[]}
     */
    allPrograms() {
        return [
            { name: 'BruteSSH.exe',       price:    500000},
            { name: 'FTPCrack.exe',       price:   1500000},
            { name: 'relaySMTP.exe',      price:   5000000},
            { name: 'HTTPWorm.exe',       price:  30000000},
            { name: 'SQLInject.exe',      price: 250000000},
            { name: 'DeepscanV1.exe',     price:    500000},
            { name: 'DeepscanV2.exe',     price:  25000000},
            { name: 'AutoLink.exe',       price:   1000000},
            { name: 'ServerProfiler.exe', price:   1000000},
        ];
    }
}