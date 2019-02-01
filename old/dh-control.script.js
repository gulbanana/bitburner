disableLog('ALL');

function err(msg) {
    tprint('Fatal error: ' + msg);
    exit();
}

function printWorker(worker) {
    return worker.name + ' (' + worker.ram + 'GB): ' + worker.job;
}

function setJob(worker, job) {
    var script = 'dh-worker-' + job + '.script';
    scp(script, worker.name);
    
    var cost = getScriptRam(script, worker.name);
    var threads = Math.floor(worker.ram / cost);
    print('assigning ' + worker.name + ' -> ' + job + ' x' + threads);
    
    if (killall(worker.name)) {
        print('...stopping old job');
        while (getServerRam(worker.name)[1] > 0) { }
        print('...old job stopped');
    }

    exec(script, worker.name, threads, target);
    print('...new job started');
    
    worker.job = job;
}

function findLeastImportant(workerMap, job) {
    var worker = null;
    for (var wID in workerMap) {
        if (workerMap[wID].job === job && (worker == null || workerMap[wID].ram < worker.ram)) {
            worker = workerMap[wID];
        }
    }
    return worker;
}

function swapJob(workerMap, oldJob, newJob) {
    var least = findLeastImportant(workerMap, oldJob);
    if (least != null) { 
        setJob(least, newJob);
    } else {
        print("error: trying to assign from " + oldJob + ' -> ' + newJob + ' but no workers are available');
    }
}

print('scan target...');
if (args.length != 1) err('hostname required');
var target = args[0];
if (!hasRootAccess(target)) err('no root');

var targetSecMin = getServerMinSecurityLevel(target);
var targetSecBase = getServerBaseSecurityLevel(target);
var targetSecGoal = ((targetSecBase - targetSecMin) / 2) + targetSecMin;
print("goal: security level <= " + Math.floor(targetSecGoal));

var targetMoneyMax = getServerMaxMoney(target);
var targetMoneyGoal = targetMoneyMax * 0.05;
print("goal: available money >= $" + Math.floor(targetMoneyGoal));

var targetTimeGrow = getGrowTime(target);
var targetTimeWeaken = getWeakenTime(target);
var targetTimeGoal = Math.max(targetTimeGrow, targetTimeWeaken) * 1000;
print("goal: sleep " + Math.floor(targetTimeGoal) + "ms");

print('scan workers...');
var workers = ['foodnstuff', 'nectar-net', 'neo-net', 'phantasy', 'sigma-cosmetics', 'joesguns', 'zer0', 'silver-helix', 'hong-fang-tea', 'harakiri-sushi', 'omega-net', 'iron-gym', 'max-hardware'];
var jobs = ['hack', 'grow', 'weaken'];
var workerMap = [];

for (var wID in workers) {
    worker = { name: workers[wID], ram: 0, job: '' };
    
    var ram = getServerRam(worker.name);
    worker.ram = ram[0];
    
    for (var jID in jobs) {
        var job = jobs[jID];
        if (isRunning('dh-worker-' + job + '.script', worker.name, target)) {
            worker.job = job;
        }
    }
    
    print('...' + printWorker(worker));
    workerMap.push(worker);
}

print('assign idle workers...');
for (var wID in workerMap) {
    var worker = workerMap[wID];
    
    if (worker.job === '') {
        setJob(worker, 'hack');
    }
}

print('monitor...');
while (true) {
    var targetSec = getServerSecurityLevel(target);
    if (targetSec > targetSecBase) {
        swapJob(workerMap, 'hack', 'weaken');
    } else if (targetSec < targetSecGoal) {
        swapJob(workerMap, 'weaken', 'hack');
    }
    
    var targetMoney = getServerMoneyAvailable(target);
    if (targetMoney < targetMoneyGoal) {
        swapJob(workerMap, 'hack', 'grow');
    } else if (targetMoney > (targetMoneyGoal * 2)) {
        swapJob(workerMap, 'grow', 'hack');
    }
    
    sleep(targetTimeGoal);
}

// decide what to do
//var growthTarget = getServerMaxMoney(target) * 0.05;
//var growthRequired = growthTarget / getServerMoneyAvailable(target);
//if (growthRequired > 1) {
  //  var growths = Math.ceil(growthAnalyze(target, growthRequired));
    //print('server drained, running grow() x ' + growths + ' to reach target of ' + growthRequired + ' multiplication');
    //runFixed('grow', growths);
//} else {
//    var perHack = hackAnalyzePercent(target);
//    var hacks = 10 / perHack;
//    print('server ready, running hack() x ' + hacks + ' to reach drain of 10%');
//    runFixed('hack', hacks);
//}