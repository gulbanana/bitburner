import { Logger } from './lib-log.js';
import * as servers from './lib-servers.js';

/** @param {IGame} ns */
export async function main(ns) {
    let log = new Logger(ns, { termInfo: true });

    for (var bot of servers.bots(ns)) {
        let idle = true;
        
        let scripts = ns.ps(bot.name);
        for (let script of scripts) {
            if (script.filename.startsWith('ms-')) {
                let job = script.filename.slice(0, script.filename.length-3).slice(3);
                if (job.startsWith('worker')) job = job.slice(7);
                log.info(`${bot.name}: ${script.args[0]} (${job})`);
                idle = false;
            }
        }

        if (idle) {
            log.info(`${bot.name}: idle`);
        }
    }
}