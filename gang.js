import { Logger } from './lib-log.js';
import * as format from './lib-format.js';

/** @param {IGame} ns */
export async function main(ns) {
    let debug = ns.args.includes('debug');
    let log = new Logger(ns, { termInfo: debug, termDebug: debug, showDebug: debug });

    function tick() {
        // recruit new members
        if (ns.gang.canRecruitMember()) {
            let name = `Ganger ${ns.gang.getMemberNames().length + 1}`;
            if (ns.gang.recruitMember(name)) {
                log.info(`recruited new member ${name}`);
            } else {
                log.error(`failed to recruit new member ${name}`);
            }
        }

        // get gang info
        let members = ns.gang.getMemberNames().map(name => {
            let m = ns.gang.getMemberInformation(name);
            m.name = name;
            return m;
        });
        if (members.length == 0) {
            log.error("no gang");
            ns.exit();
        }

        // buy and ascend
        let gear = Equipment.getAll(ns).filter(e => e.type != 'Augmentation');
        let bought = true;
        while (bought) {
            bought = false;
            let cash = ns.getServerMoneyAvailable('home');

            members.sort((a, b) => a.hackingAscensionMult - b.hackingAscensionMult); 
            let m = members[0];
            log.debug(`purchasing for least-ascended member ${m.name}`)

            let neededGear = gear.filter(e => !m.equipment.includes(e.name));
            neededGear.sort((a, b) => a.cost - b.cost);

            if (neededGear.length > 0) {
                let g = neededGear[0];
                log.debug(`missing gear:`);
                for (let e of neededGear) {
                    log.debug(e.toString());
                }

                if (neededGear[0].cost <= cash && ns.gang.purchaseEquipment(m.name, g.name)) {
                    log.info(`purchased ${g.name} for ${m.name} - ${format.money(g.cost)}`);
                    m.equipment.push(g.name);
                    bought = true;
                }
            } else {
                let result = ns.gang.ascendMember(m.name);
                if (result) {
                    log.info(`ascended ${m.name} - ${result.respect} respect`);
                    members[0] = ns.gang.getMemberInformation(m.name);
                    ns.gang.setMemberTask(m.name, 'Train Combat');
                    bought = true;
                } else {
                    log.error(`failed to ascend ${m.name}`);
                }
            }
        }
        log.debug('finished purchase run');
        
        // manage tasks
        for (let member of members) {
            let ensureTask = /** @param {string} t */ t => {
                if (member.task != t) {
                    if (ns.gang.setMemberTask(member.name, t)) {
                        log.info(`assigned ${member.name} to '${t}'`);
                    } else {
                        log.error(`failed to assign ${member.name} to '${t}'`);
                    }
                }
            };

            if (['Train Combat', 'Train Hacking', 'Train Charisma', 'Vigilante Justice'].includes(member.task)) {
                if (member.strength < (member.strengthAscensionMult * 50)) {
                    ensureTask('Train Combat');
                } else if (member.hacking < (member.hackingAscensionMult * 50)) {
                    ensureTask('Train Hacking');
                } else if (member.charisma < (member.charismaAscensionMult * 50)) {
                    ensureTask('Train Charisma');
                } else {
                    ensureTask('Vigilante Justice');
                }
            }
        }
    }

    while (true) {
        tick();
        await ns.sleep(10000);
    }
}

class Equipment {
    /**
     * @param {IGame} ns
     * @returns {Equipment[]}
     */
    static getAll(ns) {
        return ns.gang.getEquipmentNames().map(name => Equipment.get(ns, name));
    }

    /**
     * @param {IGame} ns
     * @param {string} name
     * @returns {Equipment}
     */
    static get(ns, name) {
        let cost = ns.gang.getEquipmentCost(name);
        let type = ns.gang.getEquipmentType(name);
        return new Equipment(name, cost, type);
    }

    /**
     * @param {string} name
     * @param {number} cost
     * @param {EquipmentType} type
     */
    constructor(name, cost, type) {
        this.name = name;
        this.cost = cost;
        this.type = type;
    }

    toString() {
        return `${this.type.padEnd(13)} ${this.name.padEnd(23)} ${format.money(this.cost)}`;
    }
}