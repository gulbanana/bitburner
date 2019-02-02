// @ts-check
import { Logger } from './lib-log.js';
import * as servers from './lib-servers.js';

/** @param {IGame} ns */
export async function main(ns) {
    var log = new Logger(ns, { termInfo: true, termDebug: ns.args.includes('debug') });

    if (ns.scriptRunning('dh-control.js', ns.getHostname())) {
        ns.scriptKill('dh-control.js', ns.getHostname());
        log.info('killed dh-control.js');
    }

    var jobs = ['hack', 'grow', 'weaken'];
    var counts = { hack: 0, grow: 0, weaken: 0 };

    for (let worker of servers.botsIfAny(ns)) {
        if (worker.canWork(ns)) {
            for (var jID in jobs) {
                var job = jobs[jID];
                if (ns.scriptRunning('dh-worker-' + job + '.js', worker.name)) {
                    worker.job = job;
                    ns.scriptKill('dh-worker-' + job + '.js', worker.name);
                    counts[job] += 1;
                }
            }

            log.debug(worker.print());
        }
    }

    log.info(`killed hack() x${counts.hack}`);
    log.info(`killed grow() x${counts.grow}`);
    log.info(`killed weaken() x${counts.weaken}`);
}