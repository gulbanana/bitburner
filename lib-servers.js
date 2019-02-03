export class Server {
    /**
     * @param {string} name
     * @param {number} ram
     * @param {number} ports
     * @param {string} [lock='']
     */
    constructor(name, ram, ports, lock) {
        this.name = name;
        this.ram = ram;
        this.ports = ports;
        this.lock = lock;
        this.job = '';
    }

    /**
     * @param {IGame} ns
     */
    canWork(ns) {
        return this.ram >= 2 && this.canExec(ns);
    }

    /**
     * @param {IGame} ns
     */
    canHack(ns) {
        return this.name != 'home' && !this.name.startsWith('bot') && ns.getHackingLevel() >= ns.getServerRequiredHackingLevel(this.name) && this.canExec(ns);
    }

    /**
     * @param {IGame} ns
     */
    canExec(ns) {
        return ns.hasRootAccess(this.name) || this.ports <= hacks(ns).length;
    }

    /**
     * @param {IGame} ns
     */
    enrol(ns) {
        if (!ns.hasRootAccess(this.name)) {
            for (var hack of hacks(ns)) {
                hack(this.name);
            }
            ns.nuke(this.name);
        }
    }

    print() {
        if (typeof(this.job) === 'string' && this.job !== '') {
            return `${this.name} (${this.ram}GB): ${this.job}`;
        } else {
            return `${this.name} (${this.ram}GB)`;
        }
    }
}

/**
 * @param {IGame} ns
 */
export function hacks(ns) {
    let hacks = [];
    if (ns.fileExists('BruteSSH.exe', 'home')) hacks.push(ns.brutessh);
    if (ns.fileExists('FTPCrack.exe', 'home')) hacks.push(ns.ftpcrack);
    if (ns.fileExists('relaySMTP.exe', 'home')) hacks.push(ns.relaysmtp);
    if (ns.fileExists('HTTPWorm.exe', 'home')) hacks.push(ns.httpworm);
    if (ns.fileExists('SQLInject.exe', 'home')) hacks.push(ns.sqlinject);
    return hacks;
}

/**
 * @param {IGame} ns
 */
export function bots(ns) {
    let all = [];
    for (let host of ns.getPurchasedServers(true)) {
        let ram = ns.getServerRam(host);
        all.push(new Server(host, ram[0], 0));
    }
    return all;
}

/**
 * @param {IGame} ns
 */
export function map(ns) {
    let scanned = ['home'];
    let hosts = ns.scan('home');

    while (hosts.length > 0) {
        for (let host of hosts) {
            for (let next of ns.scan(host)) {
                if (!scanned.includes(next)) {
                    hosts.push(next);
                }
            }

            hosts.splice(hosts.indexOf(host), 1);
            scanned.push(host);
        }            
    }
    scanned.splice(0, 1);

    let servers = [];
    for (let host of scanned) {
        servers.push(new Server(host, ns.getServerRam(host)[0], ns.getServerNumPortsRequired(host)));
    }
    return servers;
}

/**
 * @param {IGame} ns
 */
export function all(ns) {
    return bots(ns).concat(map(ns)).concat([new Server('home', 1536, 0, 'weaken')]);
}

export function botsIfAny(ns) {
    let bs = bots(ns);
    if (bs.length > 0) {
        return bs;
    } else {
        return map(ns).concat([new Server('home', 1536, 0, 'weaken')]);
    }
}