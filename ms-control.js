import { Logger } from './lib-log.js';
import * as format from './lib-format.js';

/** @param {IGame} ns */
export async function main(ns) {
    let target = ns.args[0];
    let log = new Logger(ns, { });

    // gather info
    let serverRam = ns.getServerRam(ns.getHostname())[0] - ns.getServerRam(ns.getHostname())[1];
    let current = ns.getServerMoneyAvailable(target);
    let goal = current / 2;
    let max = ns.getServerMaxMoney(target);
    let factor = max / current;
    let minSec = ns.getServerMinSecurityLevel(target);
    let sec = ns.getServerSecurityLevel(target);
    let maxMultiple = 4;

    /**
     * @param {string} name
     * @param {number} threads
     * @param {(hostname: string) => number} getTime
     */
    async function job(name, threads, getTime) {
        let scriptRam = ns.getScriptRam('ms-worker-' + name + '.js');
        let reqRam = scriptRam * threads;

        let multiple = 1;

        while (serverRam < reqRam && multiple < maxMultiple) {
            log.info(`${ns.getHostname()}/${target}: requires ${threads} threads for ${format.time(Math.floor(getTime(target) * multiple))}`);
            log.info(`${ns.getHostname()}/${target}: using ${format.ram(reqRam)} of ${format.ram(serverRam)}`);
            if (serverRam < reqRam) {
                log.info(`${ns.getHostname()}/${target}: ...but that's impossible. try again.`);
                threads = Math.floor(threads / 2);
                multiple = multiple * 2;
                reqRam = scriptRam * threads;
            }
        }

        if (serverRam >= reqRam) {
            await ns.exec('ms-worker-' + name + '.js', ns.getHostname(), threads, target, multiple);
        } else {
            log.error(`failed to ${name} ${target} - need at least ${format.ram(reqRam)}, have ${format.ram(serverRam)}`);
            ns.exit();
        }
    }

    // phase 1/3: weaken to minimum
    if (sec-1 > minSec) {
        log.info(`${ns.getHostname()}/${target}: weaken by ${sec - minSec}`);
        let threads = Math.ceil((sec - minSec) / 0.05);
        await job('weaken', threads, ns.getWeakenTime);
    }

    // phase 2: grow to max
    else if (factor > 1) {
        log.info(`${ns.getHostname()}/${target}: grow by factor of ${factor}`);
        let threads = Math.ceil(ns.growthAnalyze(target, factor));
        await job('grow', threads, ns.getGrowTime);
    }
    
    // phase 4: steal half
    else {
        log.info(`${ns.getHostname()}/${target}: hack \$${goal}`);
        let threads = Math.ceil(ns.hackAnalyzeThreads(target, goal));
        await job('hack', threads, ns.getHackTime);
    }
}