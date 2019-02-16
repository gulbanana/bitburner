import { Logger } from './lib-log.js';
import { programs } from './lib-world.js';
import * as format from './lib-format.js';

/** @param {IGame} ns */
export async function main(ns) {
    let loop = !ns.args.includes('noloop');
    let debug = ns.args.includes('debug');
    let log = new Logger(ns, { showDebug: debug, termInfo: !loop, termDebug: !loop && debug });

    do {
        await run(ns, log);
        await ns.sleep(30000);
    } while (loop)
}

/**
 * @param {IGame} ns
 * @param {Logger} log
 */
async function run(ns, log) {
    let purchased = true;
    let cash = ns.getServerMoneyAvailable("home");

    for (let program of programs()) {
        if (!ns.fileExists(program.name, 'home') && cash >= program.price) {
            cash = cash - program.price;
        }
    }

    log.debug('loading costs');
    let numNodes = ns.hacknet.numNodes();
    let maxProduction = 0;
    for (let i = 0; i < numNodes; i++) {
        maxProduction = Math.max(maxProduction, ns.hacknet.getNodeStats(i).production)
    }

    let costCap = (maxProduction * 60 * 60 * 24) || Infinity;
    /**
     * @param {string} name
     * @param {number} uncappedCost
     */
    function getCappedCost(name, uncappedCost) {
        if (uncappedCost > costCap) {
            log.debug(`capping ${name} cost at ${format.money(costCap)}`)
            return Infinity;
        } else {
            return uncappedCost;
        }
    }

    let costs = [];
    for (let i = 0; i < numNodes; i++) {
        costs.push(getCappedCost(`level[${i}]`, ns.hacknet.getLevelUpgradeCost(i, 1)));
        costs.push(getCappedCost(`ram[${i}]`, ns.hacknet.getRamUpgradeCost(i, 1)));
        costs.push(getCappedCost(`core[${i}]`, ns.hacknet.getCoreUpgradeCost(i, 1)));
    }

    let buyNodeCost = getCappedCost('node', ns.hacknet.getPurchaseNodeCost());

    log.debug('begin purchase run');
    while (purchased) {
        purchased = false;

        let minCost = Math.min.apply(null, costs);
        let minIdx = costs.indexOf(minCost);
        
        if (buyNodeCost < minCost) {
            if (buyNodeCost <= cash) {
                let newIdx = numNodes;
                
                log.info(`buy node[${newIdx}] - ${format.money(buyNodeCost)}`);
                ns.hacknet.purchaseNode();
                cash = cash - buyNodeCost;
                log.info(`remaining budget: ${format.money(cash)}`);
                buyNodeCost = getCappedCost('node', ns.hacknet.getPurchaseNodeCost());
                
                costs.push(ns.hacknet.getLevelUpgradeCost(newIdx, 1));
                costs.push(ns.hacknet.getRamUpgradeCost(newIdx, 1));
                costs.push(ns.hacknet.getCoreUpgradeCost(newIdx, 1));
                
                numNodes = numNodes + 1;
                purchased = true;
            }
        } else if (minCost <= cash) {
            let nodeIdx = Math.floor(minIdx / 3) % numNodes;
            let itemIdx = minIdx - (nodeIdx * 3);
            
            let cost = minCost;
            let count = 1;
            
            let getF;
            let buyF;
            let n;
            if (itemIdx == 0) {
                n = 'level'
                getF = ns.hacknet.getLevelUpgradeCost;
                buyF = ns.hacknet.upgradeLevel;
            } else if (itemIdx == 1) {
                n = 'ram';
                getF = ns.hacknet.getRamUpgradeCost;
                buyF = ns.hacknet.upgradeRam;
            } else if (itemIdx == 2) {
                n = 'core';
                getF = ns.hacknet.getCoreUpgradeCost;
                buyF = ns.hacknet.upgradeCore;
            }

            while (cost + getF(nodeIdx, count+1) < cash) {
                count = count + 1;
                cost = cost + getF(nodeIdx, count);
            }
            log.info(`buy ${n}[${nodeIdx}] x${count} - ${format.money(cost)}`);
            buyF(nodeIdx, count);
            costs[minIdx] = getCappedCost(`${n}[${nodeIdx}]`, getF(nodeIdx, 1));
            
            if (count == 1) {
                cash = cash - cost;               
            } else {
                cash = ns.getServerMoneyAvailable("home");
            }
            log.info(`remaining budget: ${format.money(cash)}`);
            
            purchased = true;
        }
    }

    log.debug('purchase run complete');
}