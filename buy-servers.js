import { Logger } from './lib-log.js';
import * as format from './lib-format.js';

/** @param {IGame} ns */
export async function main(ns) {
    let debug = ns.args.includes('debug');
    let log = new Logger(ns, { showDebug: true, termInfo: true, termDebug: debug });

    let existingServers = ns.getPurchasedServers();
    let existingRam = 0;
    let processes = [];
    for (var existing of existingServers) {
        existingRam += ns.getServerRam(existing)[0];
        let ps = ns.ps(existing);
        if (ps.length > 0) {
            processes.push(existing);
        }
    }
    existingRam /= existingServers.length;
    log.info(`${existingServers.length} existing servers, average ${format.ram(existingRam)}`);

    let cash = ns.getServerMoneyAvailable("home");
    let limit = ns.getPurchasedServerLimit();

    let p = 0;
    for (let power = 0; power < 25; power++) {
        let cost = ns.getPurchasedServerCost(Math.pow(2, power));
        if (cost * limit < cash) p = power;
    }

    let ram = Math.pow(2, p);
    let total = ns.getPurchasedServerCost(ram) * limit;
    log.info(`can buy ${limit} servers, ${format.ram(ram)} each: ${format.money(total)} total`);

    if (processes.length > 0) {
        log.info('scripts running on existing servers, exit');
        ns.exit();
    } else if (ram > existingRam) {
        log.info('deleting existing servers...');
        for (let i = 0; i < limit; i++) {
            ns.deleteServer('bot' + i);
        }
        log.info('buying new servers...');
        for (let i = 0; i < limit; i++) {
            ns.purchaseServer('bot'+i, ram);
        }
    } else {
        log.info('nothing to do, exit');
    }
}