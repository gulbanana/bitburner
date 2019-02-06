import { Logger } from './lib-log.js';
import * as format from './lib-format.js';
import * as market from './lib-market.js';

/** @param {IGame} ns */
export async function main(ns) {
    let dryRun = ns.args.includes('dry') || ns.args.includes('dryrun') || ns.args.includes('dry-run');
    let log = new Logger(ns, { });

    let thisTick = market.getAll(ns);
    function tick() {
        ns.tprint('===== WSE TIX + 4S marketdata =====')

        let lastTick = thisTick;
        thisTick = market.getAll(ns);

        for (let s of thisTick) {
            let last = lastTick[s.symbol];
            ns.tprint(`${s.symbol.padEnd(5)}: ${format.inc(last.price, s.price)}${format.money(s.price).padEnd(12)} - ${format.decper(s.forecast)} inc, ${format.decper(s.volatility)} vol`)
        }
    }

    while (true) {
        await ns.sleep(4000);
        tick();
    }
} 