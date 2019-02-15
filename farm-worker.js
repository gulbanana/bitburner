import * as world from './lib-world.js';

/** @param {IGame} ns */
export async function main(ns) {
    world.enrol(ns, 'foodnstuff');
    while (true) {
        await ns.weaken('foodnstuff');
    }
}