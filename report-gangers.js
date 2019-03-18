import { Logger } from './lib-log.js';
import * as format from './lib-format.js';

/** @param {IGame} ns */
export async function main(ns) {
    let log = new Logger(ns, { termInfo: true });

    let members = ns.gang.getMemberNames().map(name => ns.gang.getMemberInformation(name));

    log.info('----- TASKS -----')
    let tasks = members.map(m => m.task).filter((value, index, self) => self.indexOf(value) === index);
    for (let task of tasks) {
        let taskMembers = members.filter(m => m.task == task);
        let n = `${taskMembers.length} gangers`;
        let s = `(${taskMembers.map(m => m.strength).reduce((a, b) => a + b, 0)} strength)`;
        log.info(`${task.padEnd(20)} ${n.padEnd(10)} ${s.padEnd(15)}`);
    }

    log.info('----- ASCENSIONS -----')
    let mults = members.map(m => m.strengthAscensionMult).filter((value, index, self) => self.indexOf(value) === index);
    for (let mult of mults) {
        let multMembers = members.filter(m => m.strengthAscensionMult == mult);
        let n = `${multMembers.length} gangers`;
        log.info(`${format.decper(mult).padEnd(20)} ${n.padEnd(10)}`);
    }
}