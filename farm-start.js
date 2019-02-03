/// <reference path="BitBurner.d.ts" />

/** @param {IGame} ns */
export async function main(ns) {
    let bots = ns.getPurchasedServers();
    for (let bot of bots) {
        if (ns.ps(bot).length == 0) {
            ns.scp('farm-worker.js', bot);
            let scriptRam = ns.getScriptRam('farm-worker.js');
            let serverRam = ns.getServerRam(bot)[0];
            let threads = Math.floor(serverRam / scriptRam);
            ns.tprint(`${bot}: exec x${threads}`);
            await ns.exec('farm-worker.js', bot, threads);
        } else {
            ns.tprint(`${bot}: busy`);
        }
    }
}