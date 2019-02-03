/// <reference path="BitBurner.d.ts" />

/** @param {IGame} ns */
export async function main(ns) {
    let bots = ns.getPurchasedServers();
    for (let bot of bots) {
        if (ns.scriptRunning('farm-worker.js', bot)) {
            ns.tprint(`${bot}: kill`);
            ns.scriptKill('farm-worker.js', bot);
        } else {
            ns.tprint(`${bot}: idle`);
        }
    }
}