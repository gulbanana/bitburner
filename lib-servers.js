/// @ts-check

export class Server {
    /**
     * @param {string} [name]
     * @param {number} [ram]
     * @param {number} [ports]
     * @param {string} [job='']
     */
    constructor(name, ram, ports, job) {
        this.name = name;
        this.ram = ram;
        this.ports = ports;
        this.job = job || '';
    }

    canWork() {
        return this.ram > 0;
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
 * @param {IGame} [ns]
 */
export function bots(ns) {
    let all = [];
    for (let host of ns.getPurchasedServers(true)) {
        let ram = ns.getServerRam(host);
        all.push(new Server(host, ram[0], 0));
    }
    return all;
}


// notes: traversal past depth 10 is via defcomm and then zb-def
export function map() {
    return [
        new Server('home', 1024, 0),
        new Server('foodnstuff', 16, 0), 
        new Server('nectar-net', 16, 0), 
                new Server('neo-net', 32, 1), 
                    new Server('johnson-ortho', 0, 2), 
                    new Server('crush-fitness', 0, 2), 
                    new Server('avmnite-02h', 16, 2), 
                        new Server('I.I.I.I', 64, 3), 
                new Server('phantasy', 32, 2), 
                    new Server('the-hub', 8, 2), 
                        new Server('summit-uni', 64, 3), 
                            new Server('rho-construction', 16, 3), 
                    new Server('syscore', 0, 4), 
                new Server('comptek', 0, 3), 
                    new Server('zb-institute', 16, 5), 
                        new Server('alpha-ent', 16, 4), 
                            new Server('galactic-cyber', 0, 5), 
                                new Server('deltaone', 0, 5), 
                                    new Server('defcomm', 0, 5), 
                                        new Server('infocomm', 0, 5), 
                                            new Server('microdyne', 32, 5), 
                                        new Server('taiyang-digital', 0, 5), 
                                            new Server('titan-labs', 32, 5), 
                                        new Server('zb-def', 0, 4), 
                                            new Server('applied-energetics', 0, 4), 
                                                new Server('stormtech', 0, 5), 
                                                    new Server('kuai-gong', 0, 5), 
                                                        new Server('powerhouse-fitness', 16, 5), 
                                                            new Server('The-Cave', 0, 5), 
                                                    new Server('.', 16, 4), 
                                                        new Server('nwo', 0, 5), 
                                                new Server('helios', 128, 5), 
                                                    new Server('4sigma', 0, 5), 
                                                        new Server('b-and-a', 0, 5), 
                                                        new Server('blade', 64, 5), 
                                                            new Server('ecorp', 0, 5), 
                                                            new Server('megacorp', 0, 5), 
                                                            new Server('fulcrumassets', 0, 5), 
                                            new Server('run4theh111z', 256, 4), 
                                                new Server('fulcrumtech', 128, 5), 
                                                new Server('vitalife', 16, 5), 
                                                    new Server('omnitek', 256, 5), 
                                                        new Server('clarkinc', 0, 5), 
                                    new Server('univ-energy', 128, 4), 
                                    new Server('solaris', 16, 5), 
                                    new Server('zeus-med', 0, 5), 
                                        new Server('nova-med', 0, 4), 
                            new Server('aerocorp', 0, 5), 
                            new Server('global-pharm', 64, 4), 
                        new Server('aevum-police', 64, 4), 
        new Server('sigma-cosmetics', 16, 0), 
        new Server('joesguns', 16, 0), 
            new Server('zer0', 32, 1), 
                new Server('silver-helix', 64, 2),
                    new Server('netlink', 16, 3), 
                        new Server('rothman-uni', 64, 3), 
                            new Server('lexo-corp', 128, 4), 
                                new Server('snap-fitness', 0, 4), 
                                    new Server('omnia', 64, 5), 
                                    new Server('unitalife', 32, 4), 
                                        new Server('icarus', 0, 5), 
                            new Server('millenium-fitness', 128, 3), 
                        new Server('catalyst', 32, 3), 
        new Server('hong-fang-tea', 16, 0), 
        new Server('harakiri-sushi', 16, 0), 
            new Server('CSEC', 8, 1), 
                new Server('omega-net', 32, 2), 
        new Server('iron-gym', 32, 1), 
            new Server('max-hardware', 32, 1), 
    ];
}

/**
 * @param {IGame} [ns]
 */
export function all(ns) {
    return bots(ns).concat(map());
}