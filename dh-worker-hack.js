/// <reference path="BitBurner.d.ts" />

/** @param {IGame} ns */
export async function main(ns) {
    var target = ns.args[0];
    while (true) {
        await ns.hack(target);
    }
}