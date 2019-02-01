// @ts-check
import { Logger } from './lib-log.js';
import * as servers from './lib-servers.js';

/** @param {IGame} ns */
export async function main(ns) {
    var log = new Logger(ns, { termInfo: true });

    var jobs = ['hack', 'grow', 'weaken'];
    for (let worker of servers.all()) {
        if (worker.canWork()) {
            for (var jID in jobs) {
                var job = jobs[jID];
                if (ns.scriptRunning('dh-worker-' + job + '.script', worker.name)) {
                    worker.job = job;
                }
            }

            log.info(worker.print());
        }
    }
}