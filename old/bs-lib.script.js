function getRoots() {
    return ['foodnstuff', 'harakiri-sushi', 'hong-fang-tea', 'iron-gym', 'joesguns', 'max-hardware', 'nectar-net', 'neo-net', 'sigma-cosmetics', 'zer0'];
}

function err(msg) {
    tprint('Fatal error: ' + msg);
    exit();
}

function secLoop(target, count, f) {
    var i = 0;
    var baseSec = getServerBaseSecurityLevel(target);
    
    while (i < count) {
        if (getServerSecurityLevel(target) > baseSec) {
            weaken(target);
        } else {
            f();
            i++;
        }
    }    
}

function dispatch(target) {
    exec('bs-dispatch.script', 'home', 1, target);
}