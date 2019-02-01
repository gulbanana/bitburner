// @ts-check
import { Logger } from './lib-log.js';
import * as servers from './lib-servers.js';

/** @param {IGame} ns */
export async function main(ns) {
    var log = new Logger(ns, { termInfo: true });
    
    for (let worker of servers.map()) {
        let root = worker.name;

        log.info('----- SERVER: ' + root + ' -----');
    
        var sec = ns.getServerSecurityLevel(root);
        var secBase = ns.getServerBaseSecurityLevel(root);
        log.info('Security level: ' + sec + ' (' + secBase + ' base)');
        
        var moneyAvailable = ns.getServerMoneyAvailable(root);
        var maxMoney = ns.getServerMaxMoney(root);
        log.info('Money: $' + Math.floor(moneyAvailable) + '/$' + maxMoney + ' (' + Math.ceil(moneyAvailable / maxMoney * 100) + '%)');
        
        var growthRate = ns.getServerGrowth(root);
        log.info('Growth param: ' + growthRate);
        
        var hackRate = ns.hackAnalyzePercent(root);
        log.info('Per-hack: ' + Math.floor(hackRate*100)/100 + '%');

        log.info('');
    }
}