// @ts-check
import { Logger } from './lib-log.js';
import * as servers from './lib-servers.js';

/** @param {IGame} ns */
export async function main(ns) {
    var log = new Logger(ns, { termInfo: true });
    
    for (let worker of servers.map(ns)) {
        if (worker.canHack(ns)) {
            log.info('----- SERVER: ' + worker.name + ' -----');
        
            let hackLevel = ns.getServerRequiredHackingLevel(worker.name)
            let hackChance = ns.hackChance(worker.name);        
            let hackRate = ns.hackAnalyzePercent(worker.name);
            log.info(`Requires Hacking ${hackLevel}; chance ${Math.floor(hackChance*100)}%, per-hack ${Math.floor(hackRate*100)/100}%`);
            
            var moneyAvailable = ns.getServerMoneyAvailable(worker.name);
            var maxMoney = ns.getServerMaxMoney(worker.name);
            var growthRate = ns.getServerGrowth(worker.name);
            log.info(`Money: \$${Math.floor(moneyAvailable)}/\$${maxMoney} (${Math.ceil(moneyAvailable / maxMoney * 100)}%); growth param ${growthRate}`);
        
            var sec = ns.getServerSecurityLevel(worker.name);
            var secBase = ns.getServerBaseSecurityLevel(worker.name);
            log.info('Security level: ' + sec + ' (' + secBase + ' base)');

            log.info('');
        }
    }
}