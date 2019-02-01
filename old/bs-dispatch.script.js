import * as lib from 'bs-lib.script';

// run a subroutine which manages its own looping
function runLoop(name) {
    var script = 'bs-' + name + '.script';
    scp(['bs-lib.script', script], target);
    
    var mem = getServerRam(target);
    var cost = getScriptRam(script, target);
    var threads = Math.floor(mem[0] / cost);
    
    print(target + ': runLoop - ' + name + ', ' + threads + ' threads');
    exec(script, target, threads, target);
}

// run a subroutine for a fixed number of total iterations
function runFixed(name, total) {
    var script = 'bs-' + name + '.script';
    scp(['bs-lib.script', script], target);
    
    var mem = getServerRam(target);
    var cost = getScriptRam(script, target);
    var threads = Math.floor(mem[0] / cost);
    var count = Math.ceil(total / threads);
    
    print(target + ': runFixed - ' + name + ', ' + threads + ' threads, ' + count + ' iters per thread');
    exec(script, target, threads, target, count);
}

// basic checks
if (args.length != 1) lib.err('hostname required');
target = args[0];
var mem = getServerRam(target);
if (mem[1] > 0) lib.err('server has scripts running');

// decide what to do
var growthTarget = getServerMaxMoney(target) * 0.05;
var growthRequired = growthTarget / getServerMoneyAvailable(target);
if (growthRequired > 1) {
    var growths = Math.ceil(growthAnalyze(target, growthRequired));
    print('server drained, running grow() x ' + growths + ' to reach target of ' + growthRequired + ' multiplication');
    runFixed('grow', growths);
} else {
    var perHack = hackAnalyzePercent(target);
    var hacks = 10 / perHack;
    print('server ready, running hack() x ' + hacks + ' to reach drain of 10%');
    runFixed('hack', hacks);
}