import { Logger } from './lib-log.js';
import { Life } from './lib-life.js';

let HACKNET_BUYS_MAX =      10000000000;
let PURCHASED_SERVERS_MIN = 22528000000;
let STOCK_MARKET_MIN =     100000000000;

/** @param {IGame} ns */
export async function main(ns) {
    let debug = ns.args.includes('debug');
    let log = new Logger(ns, { termInfo: debug });
    let life = new Life(ns, log);
    let lastEval = 1;

    while (true) {
        // log.debug('tick');
        let cash = life.getCash();
        let skill = ns.getHackingLevel();

        // in the early game, buy a bunch of Hacknet nodes
        if (ns.hacknet.numNodes() == 0 || cash < HACKNET_BUYS_MAX) {
            await life.ensureRunning('buy-nodes.js');
        } else if (cash >= HACKNET_BUYS_MAX) {
            await life.ensureKilled('buy-nodes.js');
        }

        // XXX buy darkweb programs, train skills, etc

        // before we can afford a server farm, use DH
        if (cash < PURCHASED_SERVERS_MIN) {
            if (!life.dhRunning()) {
                if (await life.dhStart()) {
                    lastEval = skill;
                }
            } else if (skill / lastEval > 1.1) {
                if (await life.dhStop() && await life.dhStart()) {
                    lastEval = skill;
                }
            }
            
        // once a server farm is available, use MS
        } else {
            // precondition: actually buy the servers
            if (ns.getPurchasedServers().length == 0) {
                await life.runOnce('buy-servers.js');
            }

            // precondition: shut down DH (also gives time for the server-buy to go through)
            if (life.dhRunning()) {
                await life.dhStop();
            }

            if (!life.msRunning()) {
                if (await life.msStart()) {
                    lastEval = skill;
                }
            } else if (skill / lastEval > 1.1) {
                if (await life.msStop() && await life.msStart()) {
                    lastEval = skill;
                }
            }
        }

        // if stock market trading is available, turn it on
        let tix = false;
        if (tix && cash < STOCK_MARKET_MIN) {
            await life.ensureRunning('hft.js');
        }

        // use spare ram to farm hacking skill
        life.ensureRunning('farm-worker.js', true);

        await ns.sleep(30000);
    }
} 