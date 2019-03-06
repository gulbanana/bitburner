import { Logger } from './lib-log.js';
import * as world from './lib-world.js';
import * as format from './lib-format.js';

/** @param {IGame} ns */
export async function main(ns) {
    let autostart = ns.args.includes('autostart') || ns.args.includes('auto');
    let dryRun = ns.args.includes('dry') || ns.args.includes('dryrun') || ns.args.includes('dry-run');
    let log = new Logger(ns, { termInfo: true });

    function getFreeRam() {
        let ram = ns.getServerRam(ns.getHostname())
        return ram[0] - ram[1];
    }

    if (autostart) {
        log.info('----- TARGETS -----');
    }

    let targets = [];
    for (let target of world.map(ns)) {
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

    let top = ns.ps(ns.getHostname()).filter(p => p.filename == 'dh-control.js');
    if (top.length > 0) {
        let excludedTarget = top[0].args[0];
        log.info(`${excludedTarget.padEnd(20)} ignored - DH victim`);
        targets.splice(targets.findIndex(t => t.name == excludedTarget), 1);
    }

    for (let target of targets) {
        log.info(`${target.name.padEnd(20)} ${format.money(target.hackAmount / target.cycleTime).padEnd(12)} (${format.money(target.hackAmount)} in ${format.time(target.cycleTime)})`)
    }

    if (autostart) {
        log.info('----- AUTOSTART -----')

        let req = ns.getScriptRam('ms-setup.js');
        if (getFreeRam() < req) {
            log.error('insufficient ram to run ms-setup.js');
        }

        let bots = ns.getPurchasedServers()
            .filter(b => ns.ps(b).length == 0) //ignore busy
            .filter(b => ns.getServerRam(b)[0] >= 16384) // ignore too small
            .sort((a, b) => a.localeCompare(b, undefined, {numeric: true}));
        
        // ignore busy workers
        var i = bots.length;
        while (i--) {
            if (ns.ps(bots[i]).length > 0) { 
                bots.splice(i, 1);
            } 
        }

        // ignore busy targets
        for (var bot of world.bots(ns)) {            
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
            log.info(`run ms-setup.js ${bots[i]} ${targets[i].name}`)
            await ns.exec('ms-setup.js', ns.getHostname(), 1, bots[i], targets[i].name);

            while (getFreeRam() < req) {
                await ns.sleep(1 * 1000);
            }
        }
    }
}