import { Logger } from './lib-log.js';
import * as servers from './lib-servers.js';
import * as format from './lib-format.js';

/** @param {IGame} ns */
export async function main(ns) {
    var log = new Logger(ns, { termInfo: true });
    
    let targets = [];
    for (let worker of servers.map(ns)) {
        if (worker.canHack(ns)) {
            targets.push(worker);
        }
    }

    targets.sort((a, b) => ns.getServerGrowth(b.name) - ns.getServerGrowth(a.name));

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
}