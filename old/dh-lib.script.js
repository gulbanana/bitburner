function bots() {
    var all = [];
    for (var i = 1; i <= 20; i++) {
        all.push({ name: 'bot' + i, ram: 4 });
    }
    return all;
}

function map() {
    return [
        { name: 'foodnstuff', ram: 16 }, 
            { name: 'nectar-net', ram: 16 }, 
                { name: 'neo-net', ram: 32 }, 
                    { name: 'johnson-ortho', ram: 0 }, 
                    { name: 'crush-fitness', ram: 0 }, 
                    { name: 'avmnite-02h', ram: 16 }, 
                        { name: 'I.I.I.I', ram: 64 }, 
                { name: 'phantasy', ram: 32 }, 
                    { name: 'the-hub', ram: 8 }, 
                        { name: 'summit-uni',ram: 64 }, 
                            { name: 'rho-construction', ram: 16 }, 
                    { name: 'syscore', ram: 0 }, 
                { name: 'comptek', ram: 0 }, 
                    { name: 'zb-institute', ram: 16 }, 
                        { name: 'alpha-ent', ram: 16 }, 
                            { name: 'galactic-cyber', ram: 0 }, 
                                { name: 'deltaone', ram: 0 }, 
                            { name: 'aerocorp', ram: 0 }, 
                            { name: 'global-pharm', ram: 64 }, 
                        { name: 'aevum-police', ram: 64 }, 
        { name: 'sigma-cosmetics', ram: 16 }, 
        { name: 'joesguns', ram: 16 }, 
            { name: 'zer0', ram: 32 }, 
                { name: 'silver-helix', ram: 64 },
                    { name: 'netlink', ram: 16 }, 
                        { name: 'rothman-uni', ram: 64 }, 
                            { name: 'lexo-corp', ram: 128 }, 
                                { name: 'snap-fitness', ram: 0 }, 
                                    { name: 'omnia', ram: 64 }, 
                                    { name: 'unitalife', ram: 32 }, 
                            { name: 'millenium-fitness', ram: 128 }, 
                        { name: 'catalyst', ram: 32 }, 
        { name: 'hong-fang-tea', ram: 16 }, 
        { name: 'harakiri-sushi', ram: 16 }, 
            { name: 'CSEC', ram: 8 }, 
                { name: 'omega-net', ram: 32 }, 
        { name: 'iron-gym', ram: 32 }, 
            { name: 'max-hardware', ram: 32 }, 
    ];
}

function workers() {
    return bots().concat(map());
}

function printWorker(worker) {
    return worker.name + ' (' + worker.ram + 'GB): ' + worker.job;
}