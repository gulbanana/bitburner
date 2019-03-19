import { Logger } from './lib-log.js';
import * as format from './lib-format.js';

const BUY_THRESHHOLD = 1000000000;
const STAT_BASE = 30;
const MANAGED_TASKS = ['Unassigned', 'Train Combat', 'Train Hacking', 'Train Charisma', 'Vigilante Justice', 'Territory Warfare'];
const TICK_MS = 10000;
const ASSIGN_MS = 1000;

/** @param {IGame} ns */
export async function main(ns) {
    let debug = ns.args.includes('debug');
    let dryRun = ns.args.includes('dry');
    let log = new Logger(ns, { termInfo: debug, termDebug: debug, showDebug: debug });

    async function tick() {
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
        let cash = ns.getServerMoneyAvailable('home');
        log.debug(`initial cash: ${format.money(cash)}`);
        let gear = Equipment.getAll(ns).filter(e => e.type != 'Augmentation');

        let buyFor = /** @param {IMemberInformation} m */ (m) => {
            let neededGear = gear.filter(e => !m.equipment.includes(e.name)).sort((a, b) => a.cost - b.cost);
            
            while (neededGear.length > 0 && neededGear[0].cost <= cash) {
                let g = neededGear[0];
                if (ns.gang.purchaseEquipment(m.name, g.name)) {
                    log.info(`purchased ${g.name} for ${m.name} - ${format.money(g.cost)}`);

                    m.equipment.push(g.name);

                    cash = ns.getServerMoneyAvailable('home');
                    log.debug(`remaining cash: ${format.money(cash)}`);
                    neededGear = gear.filter(e => !m.equipment.includes(e.name)).sort((a, b) => a.cost - b.cost);
                } else {
                    log.error(`failed to purchase ${g.name} for ${m.name} - ${format.money(g.cost)}`);
                    break;
                }
            }

            return (neededGear.length == 0);
        };

        if (ns.getServerMoneyAvailable('home') >= BUY_THRESHHOLD || ns.getPurchasedServers().length == ns.getPurchasedServerLimit()) {
            let boughtAll = true;
            for (let m of members) {
                boughtAll = buyFor(m);
                if (!boughtAll) break;
            }

            if (boughtAll && !dryRun) {
                members.sort((a, b) => a.hackingAscensionMult - b.hackingAscensionMult); 
                let m = members.filter(m => MANAGED_TASKS.includes(m.task))[0];

                let result = ns.gang.ascendMember(m.name);
                if (result) {
                    log.info(`ascended ${m.name} - ${result.respect} respect`);
                    members[0] = ns.gang.getMemberInformation(m.name);
                    members[0].name = m.name;
                } else {
                    log.error(`failed to ascend ${m.name}`);
                }
            }
        }
        
        // manage tasks
        let info = ns.gang.getGangInformation();
        for (let member of members) {
            let ensureTask = /** @param {TaskName} t */ t => {
                if (member.task != t) {
                    if (ns.gang.setMemberTask(member.name, t)) {
                        log.info(`assigned ${member.name} to '${t}'`);
                    } else {
                        log.error(`failed to assign ${member.name} to '${t}'`);
                    }
                }
            };

            if (MANAGED_TASKS.includes(member.task) && 
                (member.task != 'Vigilante Justice' || info.wantedLevel == 1)) {
                if (member.strength < (member.strengthAscensionMult * STAT_BASE)) {
                    ensureTask('Train Combat');
                } else if (member.hacking < (member.hackingAscensionMult * STAT_BASE)) {
                    ensureTask('Train Hacking');
                //} else if (member.charisma < (member.charismaAscensionMult * STAT_BASE)) {
                //    ensureTask('Train Charisma');
                } else if (info.wantedLevelGainRate > 0 || info.wantedLevel > 100) {
                    ensureTask('Vigilante Justice');
                    await ns.sleep(ASSIGN_MS);
                    info = ns.gang.getGangInformation();
                } else {
                    ensureTask('Territory Warfare');
                }
            }
        }
    }

    while (true) {
        await tick();
        await ns.sleep(TICK_MS);
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