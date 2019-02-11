import { Logger } from './lib-log.js';

/** @param {IGame} ns */
export async function main(ns) {
    let loop = !ns.args.includes('noloop');
    let debug = ns.args.includes('debug');
    let log = new Logger(ns, { showDebug: true, termInfo: !loop, termDebug: !loop && debug });

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

    log.info('loading costs');
    let numNodes = ns.hacknet.numNodes();
    let costs = [];
    for (let i = 0; i < numNodes; i++) {
        costs.push(ns.hacknet.getLevelUpgradeCost(i, 1));
        costs.push(ns.hacknet.getRamUpgradeCost(i, 1));
        costs.push(ns.hacknet.getCoreUpgradeCost(i, 1));
    }
    let buyNodeCost = ns.hacknet.getPurchaseNodeCost();  

    log.info('begin purchase run');
    while (purchased) {
        purchased = false;

        let minCost = Math.min.apply(null, costs);
        let minIdx = costs.indexOf(minCost);
        
        if (buyNodeCost < minCost) {
            if (buyNodeCost <= cash) {
                let newIdx = numNodes;
                
                log.debug(`buy node[${newIdx}] - \$${buyNodeCost}`);
                ns.hacknet.purchaseNode();
                cash = cash - buyNodeCost;
                buyNodeCost = ns.hacknet.getPurchaseNodeCost();
                
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
            if (itemIdx == 0) {
                getF = ns.hacknet.getLevelUpgradeCost;
                buyF = ns.hacknet.upgradeLevel;
            } else if (itemIdx == 1) {
                getF = ns.hacknet.getRamUpgradeCost;
                buyF = ns.hacknet.upgradeRam;
            } else if (itemIdx == 2) {
                getF = ns.hacknet.getCoreUpgradeCost;
                buyF = ns.hacknet.upgradeCore;
            }

            while (getF(nodeIdx, count+1) < cash) {
                count = count + 1;
                cost = getF(nodeIdx, count);
            }
            log.debug(`buy level[${nodeIdx}] x${count} - \$${cost}`);
            buyF(nodeIdx, count);
            costs[minIdx] = getF(nodeIdx, 1);
            
            if (count == 1) {
                cash = cash - cost;               
            } else {
                cash = ns.getServerMoneyAvailable("home");
            }
            log.debug(`remaining budget: \$${cash}`);
            
            purchased = true;
        }
    }

    log.info('purchase run complete');
}