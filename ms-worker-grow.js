/// <reference path="BitBurner.d.ts" />

/** @param {IGame} ns */
export async function main(ns) {
    var target = ns.args[0];
    await ns.grow(target);
    while (ns.scriptRunning('ms-control.js', ns.getHostname())) {
        await ns.sleep(1000);
    }
    await ns.exec('ms-control.js', ns.getHostname(), 1, target);
}