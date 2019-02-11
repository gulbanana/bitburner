import { Logger } from './lib-log.js';
import * as servers from './lib-servers.js';
import * as format from './lib-format.js';

/** @param {IGame} ns */
export async function main(ns) {
    let autostart = ns.args.includes('autostart') || ns.args.includes('auto');
    let dryRun = ns.args.includes('dry') || ns.args.includes('dryrun') || ns.args.includes('dry-run');
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
        
        // ignore busy workers
        var i = bots.length;
        while (i--) {
            if (ns.ps(bots[i]).length > 0) { 
                bots.splice(i, 1);
            } 
        }

        // ignore busy targets
        for (var bot of servers.bots(ns)) {            
            let scripts = ns.ps(bot.name);
            for (let script of scripts) {
                if (script.filename.startsWith('ms-')) {
                    let target = script.args[0];
                    targets.splice(targets.findIndex(t => t.name == target), 1);
                }
            }
        }
        
        for (let i = 0; i < bots.length && i < targets.length; i++) {
            log.debug(`${bots[i]}: ${targets[i].name}`)
            await ns.exec('ms-setup.js', ns.getHostname(), 1, bots[i], targets[i].name);
        }
    }
}