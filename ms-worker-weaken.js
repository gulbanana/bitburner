/// <reference path="BitBurner.d.ts" />

/** @param {IGame} ns */
export async function main(ns) {
    var target = ns.args[0];
    await ns.weaken(target);
    await ns.exec('ms-control.js', ns.getHostname(), 1, target);
}