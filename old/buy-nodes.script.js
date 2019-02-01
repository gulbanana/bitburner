var purchased = true;
var cash = getServerMoneyAvailable("home");

tprint('loading costs');
var costs = [];
for (var i = 0; i < hacknet.numNodes(); i++) {
    costs.push(hacknet.getLevelUpgradeCost(i, 1));
    costs.push(hacknet.getRamUpgradeCost(i, 1));
    costs.push(hacknet.getCoreUpgradeCost(i, 1));
}
var buyNodeCost = hacknet.getPurchaseNodeCost();
var numNodes = hacknet.numNodes();

tprint('begin purchase loop');
while (purchased) {
    purchased = false;

    var minCost = Math.min.apply(null, costs);
    var minIdx = costs.indexOf(minCost);
    
    if (buyNodeCost < minCost) {
        if (buyNodeCost <= cash) {
            var newIdx = numNodes;
            
            print('buy node[newIdx] - $' + buyNodeCost);
            hacknet.purchaseNode();
            buyNodeCost = hacknet.getPurchaseNodeCost();
            
            costs.push(hacknet.getLevelUpgradeCost(newIdx, 1));
            costs.push(hacknet.getRamUpgradeCost(newIdx, 1));
            costs.push(hacknet.getCoreUpgradeCost(newIdx, 1));
            
            numNodes = numNodes + 1;
            cash = cash - minCost;
            purchased = true;
        }
    } else if (minCost <= cash) {
        var nodeIdx = Math.floor(minIdx / 3) % numNodes;
        var itemIdx = minIdx - (nodeIdx * 3);
        
        var cost = minCost;
        var count = 1;
        
        while (cost * 3 < cash) {
            count = count + 1;
            cost = cost * 3;
        }
        
        if (itemIdx == 0) {
            print('buy ' + count + 'x level[' + nodeIdx + ']');
            hacknet.upgradeLevel(nodeIdx, count);
            costs[minIdx] = hacknet.getLevelUpgradeCost(nodeIdx, 1);
        } else if (itemIdx == 1) {
            print('buy ' + count + 'x ram[' + nodeIdx + ']');
            hacknet.upgradeRam(nodeIdx, count);
            costs[minIdx] = hacknet.getRamUpgradeCost(nodeIdx, 1);
        } else if (itemIdx == 2) {
            print('buy ' + count + 'x core[' + nodeIdx + ']');
            hacknet.upgradeCore(nodeIdx, count);
            costs[minIdx] = hacknet.getCoreUpgradeCost(nodeIdx, 1);
        }
        
        if (count == 1) {
            cash = cash - cost;
            print('budget: $' + cash)
        } else {
            cash = getServerMoneyAvailable("home");
        }
        
        purchased = true;
    }
}

tprint('purchase loop complete');