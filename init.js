import { Logger } from './lib-log.js';
//import { LifeL0 as Life } from './lib-life.js';
//import { LifeL1 as Life } from './lib-life.js';
//import { LifeL2 as Life } from './lib-life.js';
import { LifeL3 as Life } from './lib-life.js';

/** @param {IGame} ns */
export async function main(ns) {
    let debug = ns.args.includes('debug');
    let log = new Logger(ns, { showDebug: debug });
    let life = new Life(ns, log);

    while (true) {
        let nextTick = await life.tick();
        await ns.sleep(nextTick);
    }
} 