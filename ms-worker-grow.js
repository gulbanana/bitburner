/// <reference path="BitBurner.d.ts" />

/** @param {IGame} ns */
export async function main(ns) {
    var target = ns.args[0];
    await ns.grow(target);
    await ns.exec('ms-control.js', ns.getHostname(), 1, target);
}