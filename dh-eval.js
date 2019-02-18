import { Logger } from './lib-log.js';
import * as world from './lib-world.js';
import * as format from './lib-format.js';

let MAX_HACK = 0.8;

/** @param {IGame} ns */
export async function main(ns) {
    let autostart = ns.args.includes('autostart') || ns.args.includes('auto');
    var log = new Logger(ns, { termInfo: true });
    
    if (autostart) {
        log.info('----- TARGETS -----');
    }

    let targets = [];
    for (let worker of world.map(ns)) {
        if (worker.canHack(ns)) {
            targets.push(worker);
        }
    }

    targets.sort((a, b) => 
    {
        let cA = Math.min(MAX_HACK, ns.hackChance(a.name));
        let cB = Math.min(MAX_HACK, ns.hackChance(b.name));
        if (cA != cB) {
            return cB - cA;
        } else {
            return ns.getServerGrowth(b.name) - ns.getServerGrowth(a.name)
        }
    });

    for (let target of targets) {        
        let hackLevel = ns.getServerRequiredHackingLevel(target.name)
        let hackChance = ns.hackChance(target.name);        
        let hackRate = ns.hackAnalyzePercent(target.name);        
        let moneyAvailable = ns.getServerMoneyAvailable(target.name);
        let maxMoney = ns.getServerMaxMoney(target.name);
        let growthRate = ns.getServerGrowth(target.name);
        var sec = ns.getServerSecurityLevel(target.name);
        var secBase = ns.getServerBaseSecurityLevel(target.name);

        log.info(`${target.name.padEnd(20)} Hack req ${hackLevel}; chance ${Math.floor(hackChance*100)}%, per-hack ${Math.floor(hackRate*100)/100}% of max ${maxMoney}`);
        log.info(`${target.name.padEnd(20)} Growth param ${growthRate}, money ${format.money(moneyAvailable)} (${Math.ceil(moneyAvailable / maxMoney * 100)}%), security level: ${sec} (${secBase} base)`);
    }

    if (autostart) {
        log.info('----- AUTOSTART -----');
        log.info(`run dh-control.js ${targets[0].name}`)
        await ns.exec('dh-control.js', ns.getHostname(), 1, targets[0].name);
    }
}