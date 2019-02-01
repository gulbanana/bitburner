import {getRoots} from 'bs-lib.script';

var roots = getRoots();
for (var key in roots) {
    var root = roots[key]
    tprint('----- SERVER: ' + root + ' -----');
    
    var sec = getServerSecurityLevel(root);
    var secBase = getServerBaseSecurityLevel(root);
    tprint('Security level: ' + sec + ' (' + secBase + ' base)');
    
    var moneyAvailable = getServerMoneyAvailable(root);
    var maxMoney = getServerMaxMoney(root);
    tprint('Money: $' + Math.floor(moneyAvailable) + '/$' + maxMoney + ' (' + Math.ceil(moneyAvailable / maxMoney * 100) + '%)');
    
    var growthRate = getServerGrowth(root);
    tprint('Growth param: ' + growthRate);
    
    var hackRate = hackAnalyzePercent(root);
    tprint('Per-hack: ' + Math.floor(hackRate*100)/100 + '%');
    
}