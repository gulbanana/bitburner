import { Logger } from './lib-log.js';
import * as format from './lib-format.js';
import * as market from './lib-market.js';

/** @param {IGame} ns */
export async function main(ns) {
    let debug = ns.args.includes('debug');
    let log = new Logger(ns, { termInfo: true, termDebug: debug });

    log.info('beginning hacknet node purchase loop...');
    await ns.exec('buy-nodes.js', 'home', 1, 'loop');

    log.info('hacking foodnstuff to enable skill farming...');
    ns.nuke('foodnstuff');

    log.info('beginning skill farming...');
    await ns.exec('farm-worker.js', 'home', 4000000);

    log.info('waiting for first hack skill increase...');
    while (ns.getServerSecurityLevel('foodnstuff') == ns.getServerBaseSecurityLevel('foodnstuff')) {
        await ns.sleep(10000);
    }

    log.info('evaluating distributed-hack targets...');
    await ns.exec('dh-eval.js', 'home', 1);

    log.info('picking hardcoded target rho-construction...'); // growth param 60, hack req 498, sec base 40
    await ns.exec('dh-control.js', 'home', 1, 'rho-construction');
} 