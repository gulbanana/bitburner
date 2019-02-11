import * as servers from './lib-servers.js';

/** @param {IGame} ns */
export async function main(ns) {
    servers.enrol(ns, 'foodnstuff');
    while (true) {
        await ns.weaken('foodnstuff');
    }
}