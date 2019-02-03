import { Logger } from './lib-log.js';
import * as format from './lib-format.js';

/** @param {IGame} ns */
export async function main(ns) {
    let dryRun = ns.args.includes('dry') || ns.args.includes('dryrun') || ns.args.includes('dry-run');
    let specify = typeof ns.args[0] === 'number';
    let debug = ns.args.includes('debug');
    let log = new Logger(ns, { termInfo: true, termDebug: debug });

    let existingServers = ns.getPurchasedServers();
    existingServers.sort((a, b) => a.localeCompare(b, undefined, {numeric: true}));

    let minRam = 0;
    let maxRam = 0;
    let processes = [];

    if (existingServers.length > 0) {
        for (var existing of existingServers) {
            let ram = ns.getServerRam(existing);
            if (ram[0] > maxRam) maxRam = ram[0];
            if (ram[0] < minRam || minRam == 0) minRam = ram[0];
            let ps = ns.ps(existing);
            if (ps.length > 0) {
                processes.push(existing);
            }
        }
    }

    log.info(`${existingServers.length} existing servers, min ${format.ram(minRam)} max ${format.ram(maxRam)}`);

    let cash = ns.getServerMoneyAvailable("home");
    let limit = specify ? ns.args[0] : ns.getPurchasedServerLimit();

    let p = 0;
    for (let power = 0; power < 25; power++) {
        let actual = limit;
        for (var existing of existingServers) {
            let existingRam = ns.getServerRam(existing);
            if (existingRam[0] >= Math.pow(2, power)) {
                actual = Math.max(actual -1, 0);
            }
        }
        let cost = ns.getPurchasedServerCost(Math.pow(2, power));
        if (cost * actual < cash) p = power;
    }

    let actual = limit;
    for (var existing of existingServers) {
        let existingRam = ns.getServerRam(existing);
        if (existingRam[0] >= Math.pow(2, p)) {
            actual = Math.max(actual -1, 0);
        }
    }

    let ram = Math.pow(2, p);
    let total = ns.getPurchasedServerCost(ram) * actual;
    log.info(`can buy ${actual} servers, ${format.ram(ram)} each: ${format.money(total)} total`);

    if (!dryRun && processes.length > 0) {
        log.info('scripts running on existing servers, exit');
        ns.exit();
    } else if (ram > minRam || existingServers.length < limit) {
        log.info('deleting existing servers...');
        let sold = [];
        for (let i = 0; i < existingServers.length && i < limit; i++) {
            if (ns.getServerRam(existingServers[i])[0] < ram) {
                log.debug(`delete ${existingServers[i]}`);
                sold.push(existingServers[i]);
                if (!dryRun) ns.deleteServer(existingServers[i]);
            } else {
                log.debug(`keep ${existingServers[i]}`);
            }
        }
        log.info('buying new servers...');
        for (let i = 0; i < limit; i++) {
            if (!ns.serverExists(existingServers[i]) || sold.includes(existingServers[i])) {
                log.debug(`buy bot${i}`);
                if (!dryRun) ns.purchaseServer('bot'+i, ram);
            }
        }
    } else {
        log.info('nothing to do, exit');
    }
}