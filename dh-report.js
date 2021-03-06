import { Logger } from './lib-log.js';
import * as world from './lib-world.js';

/** @param {IGame} ns */
export async function main(ns) {
    var log = new Logger(ns, { termInfo: true, termDebug: ns.args.includes('debug') });

    var jobs = ['hack', 'grow', 'weaken'];
    var counts = { hack: 0, grow: 0, weaken: 0 };

    for (let worker of world.map(ns)) {
        if (worker.canWork(ns)) {
            for (var jID in jobs) {
                var job = jobs[jID];
                if (ns.scriptRunning('dh-worker-' + job + '.js', worker.name)) {
                    worker.job = job;
                    counts[job] += worker.ram;
                }
            }

            log.debug(worker.print());
        }
    }

    log.info(`total hack(): ${counts.hack}GB`);
    log.info(`total grow(): ${counts.grow}GB`);
    log.info(`total weaken(): ${counts.weaken}GB`);
}