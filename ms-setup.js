import { Logger } from './lib-log.js';
import * as servers from './lib-servers.js';

/** @param {IGame} ns */
export async function main(ns) {
    let log = new Logger(ns, {});
    let host = ns.args[0]

    ns.scp(['lib-log.js', 'ms-control.js', 'ms-worker-grow.js', 'ms-worker-weaken.js', 'ms-worker-hack.js',], host);

    if (ns.args.length > 1) {
        let target = ns.args[1];
        let worker = new servers.Server(target, ns.getServerRam(target)[0], ns.getServerNumPortsRequired(target));
        worker.enrol(ns);
        await ns.exec('ms-control.js', host, 1, target);
    }
}