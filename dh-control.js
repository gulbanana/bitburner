// @ts-check
import { Logger } from './lib-log.js';
import * as servers from './lib-servers.js';

/** @param {IGame} ns */
export async function main(ns) {
    let log = new Logger(ns, { showInfo: true, showDebug: true, termInfo: true, termDebug: true });

    /** 
     * @param {servers.Server} worker
     * @param {string} worker
     */
    async function setJob(worker, job) {
        let script = 'dh-worker-' + job + '.js';
        ns.scp(script, worker.name);
        
        let cost = ns.getScriptRam(script, worker.name);
        let threads = Math.floor(worker.ram / cost);
        log.info(`assigning ${worker.name} ${worker.job} -> ${job} x${threads}`);
        
        if (ns.killall(worker.name)) {
            log.debug('stopping old job');
            while (ns.getServerRam(worker.name)[1] > 0) { 
                await ns.sleep(100);
            }
            log.debug('old job stopped');
        }

        await ns.exec(script, worker.name, threads, target);
        log.debug('new job started');
        
        worker.job = job;
    }

    /**
     * @param {string} job
     */
    function findLeastImportant(job) {
        /** @type {servers.Server} */
        let worker = null;
        for (let w of workerMap) {
            if (w.job === job && (worker == null || w.ram < worker.ram)) {
                return w;
            }
        }
        return worker;
    }
    
    /**
     * @param {string} job
     */
    function findAll(job) {
        let workers = [];
        for (let worker of workerMap) {
            if (worker.job === job) {
                workers.push(worker);
            }
        }
        return workers;
    }
    
    /**
     * @param {string} oldJob
     * @param {string} newJob
     */
    async function swapJob(oldJob, newJob) {
        let least = findLeastImportant(oldJob);
        if (least != null) { 
            await setJob(least, newJob);
        } else {
            log.error(`trying to assign from ${oldJob} -> ${newJob} but no workers are available`);
        }
    }

    function enrol(worker) {
        log.debug('enrolling ' + worker.name);
        
        ns.brutessh(worker.name);
        ns.ftpcrack(worker.name);
        ns.relaysmtp(worker.name);
        ns.httpworm(worker.name);
        ns.sqlinject(worker.name);
        ns.nuke(worker.name);
        
        log.debug('...got root');
    }

    log.info('scan target...');
    if (ns.args.length < 1) log.error('hostname required');
    var target = ns.args[0];
    if (!ns.hasRootAccess(target)) {
        enrol(target);
    }

    var targetSecMin = ns.getServerMinSecurityLevel(target);
    var targetSecBase = ns.getServerBaseSecurityLevel(target);
    var targetSecGoal = ((targetSecBase - targetSecMin) / 2) + targetSecMin;
    log.info("goal: security level <= " + Math.floor(targetSecGoal));

    var targetMoney = ns.getServerMoneyAvailable(target);
    var targetMoneyMax = ns.getServerMaxMoney(target);
    var targetMoneyGoal = targetMoneyMax * (ns.args.length < 2 ? 0.5 : ns.args[1]);
    log.info("goal: available money >= $" + Math.floor(targetMoneyGoal));

    var targetTimeGrow = ns.getGrowTime(target);
    var targetTimeWeaken = ns.getWeakenTime(target);
    var targetTimeGoal = Math.max(targetTimeGrow, targetTimeWeaken) * 1000;
    log.info("goal: sleep " + Math.floor(targetTimeGoal) + "ms");

    log.info('scan workers...');
    let jobs = ['hack', 'grow', 'weaken'];
    /** @type {servers.Server[]} */
    let workerMap = [];

    for (let worker of servers.all()) {
        if (worker.canWork()) {
            worker.job = '';
            
            for (let job of jobs) {
                if (ns.isRunning('dh-worker-' + job + '.js', worker.name, target)) {
                    worker.job = job;
                }
            }
            
            log.debug(worker.print());
            workerMap.push(worker);
        }
    }

    log.info('assign idle workers...');
    for (let worker of workerMap) {
        if (worker.job === '') {
            if (!ns.hasRootAccess(worker.name)) {
                enrol(worker);
            } 
            
            if (targetMoney > targetMoneyGoal) {
                await setJob(worker, 'hack');
            } else {
                await setJob(worker, 'grow');
            }
        }
    }

    log.info('monitor...');
    while (true) {
        var targetSec = ns.getServerSecurityLevel(target);
        targetMoney = ns.getServerMoneyAvailable(target);
        
        log.info('status: sec level ' + Math.floor(targetSecGoal) + ' < ' + Math.floor(targetSec) + ' < ' + Math.floor(targetSecBase));
        log.info('status: money $' + Math.floor(targetMoneyGoal) + ' < $' + Math.floor(targetMoney) + ' < $' + Math.floor(targetMoneyGoal*2));
        
        if (targetSec > targetSecBase) {
            if (findAll('hack').length > 0) {
                await swapJob('hack', 'weaken');
            } else {
                await swapJob('grow', 'weaken');
            }
        } else if (targetSec < targetSecGoal) {
            await swapJob('weaken', 'hack');
        }
        
        if (targetMoney < targetMoneyGoal && findAll('hack').length > 0) {
            await swapJob('hack', 'grow');
        } else if (targetMoney > (targetMoneyGoal * 2)) {
            await swapJob('grow', 'hack');
        }
        
        await ns.sleep(30000);
    }
}