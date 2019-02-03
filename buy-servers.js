import { Logger } from './lib-log.js';

/** @param {IGame} ns */
export async function main(ns) {
    let debug = ns.args.includes('debug');
    let log = new Logger(ns, { showDebug: true, termInfo: true, termDebug: debug });

    let cash = ns.getServerMoneyAvailable("home");
    let limit = ns.getPurchasedServerLimit();

    let p = 0;
    for (let power = 0; power < 25; power++) {
        let cost = ns.getPurchasedServerCost(Math.pow(2, power));
        if (cost * limit < cash) p = power;
    }

    let ram = Math.pow(2, p);
    let total = ns.getPurchasedServerCost(ram) * limit;
    log.info(`${limit} servers, ${ram}GB each: \$${total}`);
}