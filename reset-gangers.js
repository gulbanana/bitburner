import { Logger } from './lib-log.js';
import * as format from './lib-format.js';

/** @param {IGame} ns */
export async function main(ns) {
    let log = new Logger(ns, { termInfo: true });

    let names = ns.gang.getMemberNames();
    let n = parseInt(ns.args[0]);
    let t = n ? ns.args[1] : ns.args[0];
    n = n || names.length;

    log.info(`Assigning ${n} gangers to '${t}'...`);

    let members = names.map(name => {
        let info = ns.gang.getMemberInformation(name);
        info.name = name;
        return info;
    });

    members.sort((a, b) => b.strengthAscensionMult - a.strengthAscensionMult);
    for (let i = 0; i < n; i++) {
        let m = members[i];
        log.info(`${m.name} (${format.decper(m.strengthAscensionMult)})`);
        ns.gang.setMemberTask(m.name, t);
    }
}