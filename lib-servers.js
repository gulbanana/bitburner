/// @ts-check

class Server {
    /**
     * @param {string} [name]
     * @param {number} [ram]
     */
    constructor(name, ram) {
        this.name = name;
        this.ram = ram;
        this.job = '';
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

export function bots() {
    var all = [];
    for (var i = 1; i <= 20; i++) {
        all.push(new Server('bot'+i, 4));
    }
    return all;
}

export function map() {
    return [
        new Server('foodnstuff', 16), 
        new Server('nectar-net', 16), 
                new Server('neo-net', 32), 
                    new Server('johnson-ortho', 0), 
                    new Server('crush-fitness', 0), 
                    new Server('avmnite-02h', 16), 
                        new Server('I.I.I.I', 64), 
                new Server('phantasy', 32), 
                    new Server('the-hub', 8), 
                        new Server('summit-uni',64), 
                            new Server('rho-construction', 16), 
                    new Server('syscore', 0), 
                new Server('comptek', 0), 
                    new Server('zb-institute', 16), 
                        new Server('alpha-ent', 16), 
                            new Server('galactic-cyber', 0), 
                                new Server('deltaone', 0), 
                            new Server('aerocorp', 0), 
                            new Server('global-pharm', 64), 
                        new Server('aevum-police', 64), 
        new Server('sigma-cosmetics', 16), 
        new Server('joesguns', 16), 
            new Server('zer0', 32), 
                new Server('silver-helix', 64),
                    new Server('netlink', 16), 
                        new Server('rothman-uni', 64), 
                            new Server('lexo-corp', 128), 
                                new Server('snap-fitness', 0), 
                                    new Server('omnia', 64), 
                                    new Server('unitalife', 32), 
                            new Server('millenium-fitness', 128), 
                        new Server('catalyst', 32), 
        new Server('hong-fang-tea', 16), 
        new Server('harakiri-sushi', 16), 
            new Server('CSEC', 8), 
                new Server('omega-net', 32), 
        new Server('iron-gym', 32), 
            new Server('max-hardware', 32), 
    ];
}

export function all() {
    return bots().concat(map());
}