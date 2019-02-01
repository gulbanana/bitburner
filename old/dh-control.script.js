import * as lib from 'dh-lib.script';

disableLog('ALL');

function err(msg) {
    tprint('Fatal error: ' + msg);
    exit();
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

function findAll(workerMap, job) {
    var workers = [];
    for (var wID in workerMap) {
        if (workerMap[wID].job === job) {
            workers.push(workerMap[wID]);
        }
    }
    return workers;
}

function swapJob(workerMap, oldJob, newJob) {
    var least = findLeastImportant(workerMap, oldJob);
    if (least != null) { 
        setJob(least, newJob);
    } else {
        print("error: trying to assign from " + oldJob + ' -> ' + newJob + ' but no workers are available');
    }
}

function enrol(worker) {
    print('enrolling ' + worker.name);
    
    brutessh(worker.name);
    ftpcrack(worker.name);
    relaysmtp(worker.name);
    httpworm(worker.name);
    sqlinject(worker.name);
    nuke(worker.name);
    
    print('...got root');
}

print('scan target...');
if (args.length < 1) err('hostname required');
var target = args[0];
if (!hasRootAccess(target)) err('no root');

var targetSecMin = getServerMinSecurityLevel(target);
var targetSecBase = getServerBaseSecurityLevel(target);
var targetSecGoal = ((targetSecBase - targetSecMin) / 2) + targetSecMin;
print("goal: security level <= " + Math.floor(targetSecGoal));

var targetMoney = getServerMoneyAvailable(target);
var targetMoneyMax = getServerMaxMoney(target);
var targetMoneyGoal = targetMoneyMax * (args.length < 2 ? 0.05 : args[1]);
print("goal: available money >= $" + Math.floor(targetMoneyGoal));

var targetTimeGrow = getGrowTime(target);
var targetTimeWeaken = getWeakenTime(target);
var targetTimeGoal = Math.max(targetTimeGrow, targetTimeWeaken) * 1000;
print("goal: sleep " + Math.floor(targetTimeGoal) + "ms");

print('scan workers...');
var jobs = ['hack', 'grow', 'weaken'];
var workerMap = [];
var ws = lib.workers();

for (var wID in ws) {
    worker = ws[wID];
    
    if (worker.ram > 0) {
        worker.job = '';
        
        for (var jID in jobs) {
            var job = jobs[jID];
            if (isRunning('dh-worker-' + job + '.script', worker.name, target)) {
                worker.job = job;
            }
        }
        
        print('...' + lib.printWorker(worker));
        workerMap.push(worker);
    }
}

print('assign idle workers...');
for (var wID in workerMap) {
    var worker = workerMap[wID];
    
    if (worker.job === '') {
        if (!hasRootAccess(worker.name)) {
            enrol(worker);
        } 
        
        if (targetMoney > targetMoneyGoal) {
            setJob(worker, 'hack');
        } else {
            setJob(worker, 'grow');
        }
    }
}

print('monitor...');
while (true) {
    var targetSec = getServerSecurityLevel(target);
    targetMoney = getServerMoneyAvailable(target);
    
    print('status: sec level ' + Math.floor(targetSecGoal) + ' < ' + Math.floor(targetSec) + ' < ' + Math.floor(targetSecBase));
    print('status: money $' + Math.floor(targetMoneyGoal) + ' < $' + Math.floor(targetMoney) + ' < $' + Math.floor(targetMoneyGoal*2));
    
    if (targetSec > targetSecBase) {
        if (findAll(workerMap, 'hack').length > 0) {
            swapJob(workerMap, 'hack', 'weaken');
        } else {
            swapJob(workerMap, 'grow', 'weaken');
        }
    } else if (targetSec < targetSecGoal) {
        swapJob(workerMap, 'weaken', 'hack');
    }
    
    if (targetMoney < targetMoneyGoal && findAll(workerMap, 'hack').length > 0) {
        swapJob(workerMap, 'hack', 'grow');
    } else if (targetMoney > (targetMoneyGoal * 2)) {
        swapJob(workerMap, 'grow', 'hack');
    }
    
    sleep(targetTimeGoal);
}