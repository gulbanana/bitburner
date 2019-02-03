import { Logger } from './lib-log.js';

/** @param {IGame} ns */
export async function main(ns) {
    let target = ns.args[0];
    let log = new Logger(ns, { });

    // gather info
    let serverRam = ns.getServerRam(ns.getHostname())[0] - ns.getServerRam(ns.getHostname())[1];
    let current = ns.getServerMoneyAvailable(target);
    let max = ns.getServerMaxMoney(target);
    let factor = max / current;
    let minSec = ns.getServerMinSecurityLevel(target);
    let sec = ns.getServerSecurityLevel(target);

    // phase 1/3: weaken to minimum
    if (sec > minSec) {
        log.info(`${ns.getHostname()}/${target}: weaken by ${sec - minSec}`);

        let threads = Math.ceil((sec - minSec) / 0.05);
        log.info(`${ns.getHostname()}/${target}: requires ${threads} threads for ${Math.floor(ns.getWeakenTime(target))} seconds`);

        let scriptRam = ns.getScriptRam('ms-worker-weaken.js')
        log.info(`${ns.getHostname()}/${target}: using ${scriptRam * threads}GB of ${serverRam}GB`);
        
        await ns.exec('ms-worker-weaken.js', ns.getHostname(), threads, target);
    }

    // phase 2: grow to max
    else if (factor > 1) {
        log.info(`${ns.getHostname()}/${target}: grow by factor of ${factor}`);

        let threads = Math.ceil(ns.growthAnalyze(target, factor));
        log.info(`${ns.getHostname()}/${target}: requires ${threads} threads for ${Math.floor(ns.getGrowTime(target))} seconds`);

        let scriptRam = ns.getScriptRam('ms-worker-grow.js')
        log.info(`${ns.getHostname()}/${target}: using ${scriptRam * threads}GB of ${serverRam}GB`);
        
        await ns.exec('ms-worker-grow.js', ns.getHostname(), threads, target);
    }
    
    // phase 4: steal half
    else {
        let goal = current / 2;
        log.info(`${ns.getHostname()}/${target}: hack \$${goal}`);

        let threads = Math.ceil(ns.hackAnalyzeThreads(target, goal));
        log.info(`${ns.getHostname()}/${target}: requires ${threads} threads for ${Math.floor(ns.getHackTime(target))} seconds`);

        let scriptRam = ns.getScriptRam('ms-worker-hack.js')
        log.info(`${ns.getHostname()}/${target}: using ${scriptRam * threads}GB of ${serverRam}GB`);     
        
        await ns.exec('ms-worker-hack.js', ns.getHostname(), threads, target);
    }
}