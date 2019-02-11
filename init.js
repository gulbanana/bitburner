import { Logger } from './lib-log.js';
import * as format from './lib-format.js';
import * as market from './lib-market.js';

/** @param {IGame} ns */
export async function main(ns) {
    let debug = ns.args.includes('debug');
    let log = new Logger(ns, { termInfo: true, termDebug: debug });

    log.info('beginning hacknet node purchase loop');
    await ns.exec('buy-nodes.js', 'home', 1, 'loop');

    log.info('hacking foodnstuff to enable skill farming');
    ns.nuke('foodnstuff');

    log.info('beginning skill farming');
    let homeRam = ns.getServerRam('home');
    let homeFree = homeRam[0] - homeRam[1];
    let scriptCost = ns.getScriptRam('farm-worker.js');
    let threads = Math.floor(homeFree / scriptCost);    
    await ns.exec('farm-worker.js', 'home', threads);

    log.info('waiting for first hack skill increase');
    while (ns.getServerSecurityLevel('foodnstuff') == ns.getServerBaseSecurityLevel('foodnstuff')) {
        await ns.sleep(10000);
    }

    log.info('initiating distributed-hack architecture');
    await ns.exec('dh-eval.js', 'home', 1);
    await ns.exec('dh-control.js', 'home', 1, 'rho-construction'); // hardcoded - growth param 60, hack req 498, sec base 40

    log.info('waiting to shutdown hacknet node purchase loop');
    while (ns.getServerMoneyAvailable('home') < 10000000000) {
        await ns.sleep(10000);
    }
    while (!await ns.scriptKill('buy-nodes.js', 'home')) {
        await ns.sleep(10000);
    }

    // XXX need to get programs from the darkweb here

    /*
    log.info('waiting for enough money to buy 16TB servers');
    while (ns.getServerMoneyAvailable('home') < 22528000000) {
        await ns.sleep(10000);
    }

    log.info('purchasing server farm');
    await ns.exec('buy-servers.js', 'home', 1, 'debug');

    log.info('switching from distributed-hack to mega-server architecture');
    await ns.exec('dh-stop.js', 'home', 1);
    await ns.exec('ms-eval.js', 'home', 1, 'autostart');

    log.info('waiting for enough money to trade stocks');
    while (ns.getServerMoneyAvailable('home') < 100000000000) {
        await ns.sleep(10000);
    }

    log.info('initiating stock trading loop');
    await ns.exec('hft.js', 'home', 1);
    */
} 