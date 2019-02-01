// @ts-check
import { Logger } from './lib-log.js';
import * as servers from './lib-servers.js';

/** @param {IGame} ns */
export async function main(ns) {
    var log = new Logger(ns, { termInfo: true });
    
    for (let worker of servers.map()) {
        let root = worker.name;

        let hackLevel = ns.getServerRequiredHackingLevel(root)
        if (hackLevel <= ns.getHackingLevel()) {
            log.info('----- SERVER: ' + root + ' -----');
            
            let hackChance = ns.hackChance(root);        
            let hackRate = ns.hackAnalyzePercent(root);
            log.info(`Requires Hacking ${hackLevel}; chance ${Math.floor(hackChance*100)/100}%, per-hack ${Math.floor(hackRate*100)/100}%`);
            
            var moneyAvailable = ns.getServerMoneyAvailable(root);
            var maxMoney = ns.getServerMaxMoney(root);
            var growthRate = ns.getServerGrowth(root);
            log.info(`Money: \$${Math.floor(moneyAvailable)}/\$${maxMoney} (${Math.ceil(moneyAvailable / maxMoney * 100)}%); growth param ${growthRate}`);
        
            var sec = ns.getServerSecurityLevel(root);
            var secBase = ns.getServerBaseSecurityLevel(root);
            log.info('Security level: ' + sec + ' (' + secBase + ' base)');

            log.info('');
        }
    }
}