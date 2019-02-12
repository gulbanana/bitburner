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
 * @returns {((host: string) => void)[]}
 */
export function hacks(ns) {
    /** @type {((host: string) => void)[]} */
    let hacks = [];

    for (let program of programs()) {
        if (program.hack && ns.fileExists(program.name, 'home')) {
            hacks.push(program.hack(ns));
        }
    }

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

export class Program {
    /**
     * @param {number} req
     * @param {string} name
     * @param {number} price
     * @param {(ns: IGame) => ((host: string) => void)} [hack]
     */
    constructor(req, name, price, hack) {
        this.req = req;
        this.name = name;
        this.price = price;
        this.hack = hack;
    }
}

export function programs() {
    return [
        new Program( 50, 'BruteSSH.exe',          500000, ns => ns.brutessh),
        new Program(100, 'FTPCrack.exe',         1500000, ns => ns.ftpcrack),
        new Program(250, 'relaySMTP.exe',        5000000, ns => ns.relaysmtp),
        new Program(500, 'HTTPWorm.exe',        30000000, ns => ns.httpworm),
        new Program(750, 'SQLInject.exe',      250000000, ns => ns.sqlinject),
        new Program( 75, 'DeepscanV1.exe',        500000),
        new Program(400, 'DeepscanV2.exe',      25000000),
        new Program( 25, 'AutoLink.exe',         1000000),
        new Program( 75, 'ServerProfiler.exe',   1000000),
    ];
}

export class Gym {
    /**
     * @param {string} name
     * @param {string} city
     * @param {number} price
     */
    constructor(name, city, price) {
        this.name = name;
        this.city = city;
        this.price = price;
    }
}

export function gyms() {
    return [
        new Gym('Crush Fitness Gym', 'Aevum', 360), 
        new Gym('Snap Fitness Gym', 'Aevum', 1200), 
        new Gym('Iron Gym', 'Sector-12', 120), 
        new Gym('Powerhouse Gym', 'Sector-12', 2400), 
        new Gym('Millenium Fitness Gym', 'Volhaven', 840),
    ]
}