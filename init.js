import { Logger } from './lib-log.js';
import { TICK_LENGTH } from './lib-life-L0.js';
//import { LifeL0 as Life } from './lib-life-L0.js';
//import { LifeL1 as Life } from './lib-life-L1.js';
//import { LifeL2 as Life } from './lib-life-L2.js';
import { LifeL3 as Life } from './lib-life-L3.js';

/** @param {IGame} ns */
export async function main(ns) {
    let debug = ns.args.includes('debug');
    let log = new Logger(ns, { showDebug: debug });
    let life = new Life(ns, log);

    while (true) {
        await life.tick();
        await ns.sleep(TICK_LENGTH * 1000);
    }
} 