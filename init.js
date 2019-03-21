import { Logger } from './lib-log.js';
import { Life } from './lib-life.js';

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