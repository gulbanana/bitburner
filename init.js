import { Logger } from './lib-log.js';
// import { Life } from './lib-life.js';
import { VirtualLife as Life } from './lib-life-virtual.js';

/** @param {IGame} ns */
export async function main(ns) {
    let debug = ns.args.includes('debug');
    let log = new Logger(ns, { termInfo: debug });
    let life = new Life(ns, log);

    while (true) {
        // log.debug('tick');
        await life.tick();
        await ns.sleep(30000);
    }
} 