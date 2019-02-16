import { Logger } from './lib-log.js';
import { TICK_LENGTH, LifeL3 as Life } from './lib-life.js';

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