/// <reference path="BitBurner.d.ts" />

/** @param {IGame} ns */
export async function main(ns) {
    let target = ns.args.length == 0 ? 'foodnstuff' : ns.args[0];

    while (true) {
        await ns.weaken(target);
    }
}