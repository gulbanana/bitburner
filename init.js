import { Logger } from './lib-log.js';
import { TICK_LENGTH } from './lib-life.js';
import { VirtualLife as Life } from './lib-life-virtual.js';

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