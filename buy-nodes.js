import { Logger } from './lib-log.js';

/** @param {IGame} ns */
export async function main(ns) {
    let loop = ns.args.includes('loop');
    let debug = ns.args.includes('debug');
    let log = new Logger(ns, { showDebug: true, termInfo: !loop, termDebug: !loop && debug });

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

    log.info('begin purchase loop');
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
            
            if (itemIdx == 0) {
                while (cost * 3 < cash) {
                    count = count + 1;
                    cost = ns.hacknet.getLevelUpgradeCost(nodeIdx, count);
                }

                log.debug(`buy level[${nodeIdx}] x${count} - \$${cost}`);
                ns.hacknet.upgradeLevel(nodeIdx, count);
                costs[minIdx] = ns.hacknet.getLevelUpgradeCost(nodeIdx, 1);
            } else if (itemIdx == 1) {
                while (cost * 3 < cash) {
                    count = count + 1;
                    cost = ns.hacknet.getRamUpgradeCost(nodeIdx, count);
                }

                log.debug(`buy ram[${nodeIdx}] x${count} - \$${cost}`);
                ns.hacknet.upgradeRam(nodeIdx, count);
                costs[minIdx] = ns.hacknet.getRamUpgradeCost(nodeIdx, 1);
            } else if (itemIdx == 2) {
                while (cost * 3 < cash) {
                    count = count + 1;
                    cost = ns.hacknet.getCoreUpgradeCost(nodeIdx, count);
                }

                log.debug(`buy core[${nodeIdx}] x${count} - \$${cost}`);
                ns.hacknet.upgradeCore(nodeIdx, count);
                costs[minIdx] = ns.hacknet.getCoreUpgradeCost(nodeIdx, 1);
            }
            
            if (count == 1) {
                cash = cash - cost;               
            } else {
                cash = ns.getServerMoneyAvailable("home");
            }
            log.debug(`remaining budget: \$${cash}`);
            
            purchased = true;
        }
    }

    log.info('purchase loop complete');

    if (loop) {
        await ns.sleep(10000);
        ns.spawn('buy-nodes.js', 1, 'loop');
    }
}