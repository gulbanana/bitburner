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
        this.links = [];
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
        return this.name != 'home' && 
               !this.name.startsWith('bot') &&
               ns.getHackingLevel() >= ns.getServerRequiredHackingLevel(this.name) && 
               ns.getServerMaxMoney(this.name) > 0 &&
               this.canExec(ns);
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
        enrol(ns, this.name);
    }

    print() {
        if (typeof(this.job) === 'string' && this.job !== '') {
            return `${this.name} (${this.ram}GB): ${this.job}`;
        } else {
            return `${this.name} (${this.ram}GB)`;
        }
    }

    toString() {
        return this.print();
    }
}

/**
 * @param {IGame} ns
 * @param {string} host
 */
export function enrol(ns, host) {
    if (!ns.hasRootAccess(host)) {
        for (var hack of hacks(ns)) {
            hack(host);
        }
        ns.nuke(host);
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
    all.sort((a, b) => a.name.localeCompare(b.name, undefined, {numeric: true}));
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
            if (!host.startsWith('bot')) {
                for (let next of ns.scan(host)) {
                    if (!scanned.includes(next)) {
                        hosts.push(next);
                    }
                }
                scanned.push(host);
            }

            hosts.splice(hosts.indexOf(host), 1);
        }            
    }
    scanned.splice(0, 1);

    let servers = [];
    for (let host of scanned) {
        let server = new Server(host, ns.getServerRam(host)[0], ns.getServerNumPortsRequired(host));
        for (let next of ns.scan(server.name)) {
            server.links.push(next);
        }
        servers.push(server);
        servers[server.name] = server;
    }
    return servers;
}

/** @param {IGame} ns */
export function all(ns) {
    return bots(ns).concat(map(ns));
}