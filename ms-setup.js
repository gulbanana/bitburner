import { Logger } from './lib-log.js';
import * as world from './lib-world.js';

/** @param {IGame} ns */
export async function main(ns) {
    let log = new Logger(ns, { termInfo: false });
    let host = ns.args[0]

    log.info(`copy scripts to ${host}`);
    ns.scp(['lib-log.js', 'lib-format.js', 'ms-control.js', 'ms-worker-grow.js', 'ms-worker-weaken.js', 'ms-worker-hack.js',], host);

    if (ns.args.length > 1) {
        let target = ns.args[1];
        let worker = new world.Server(target, ns.getServerRam(target)[0], ns.getServerNumPortsRequired(target));
        worker.enrol(ns);

        log.info(`execute attack on ${target}`);
        await ns.exec('ms-control.js', host, 1, target);
    }
}