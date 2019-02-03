import { Logger } from './lib-log.js';
import * as servers from './lib-servers.js';
import * as format from './lib-format.js';

/** @param {IGame} ns */
export async function main(ns) {
    let autostart = ns.args.includes('autostart')
    let log = new Logger(ns, { termInfo: true });

    let targets = [];
    for (let target of servers.map(ns)) {
        let weakenTime = ns.getWeakenTime(target.name);
        let growTime = ns.getGrowTime(target.name);
        let hackTime = ns.getHackTime(target.name);
        hackTime = hackTime / ns.hackChance(target.name); // since it might take multiple tries

        let cycleTime = weakenTime + growTime + weakenTime + hackTime;
        let hackAmount = ns.getServerMaxMoney(target.name) / 2;

        if (target.canHack(ns)) {
            targets.push({
                name: target.name,
                cycleTime: cycleTime,
                hackAmount: hackAmount,
            })
        }
    }

    targets.sort((a, b) => {
        return (b.hackAmount/b.cycleTime) > (a.hackAmount/a.cycleTime) ? 1 : -1;
    });

    for (let target of targets) {
        log.info(`${target.name.padEnd(20)} ${format.money(target.hackAmount / target.cycleTime).padEnd(12)} (${format.money(target.hackAmount)} in ${format.time(target.cycleTime)})`)
    }

    if (autostart) {
        let bots = ns.getPurchasedServers();
        for (let i = 0; i < bots.length && i < targets.length; i++) {
            await ns.exec('ms-setup.js', ns.getHostname(), 1, bots[i], targets[i].name);
        }
    }
}