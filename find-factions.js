import { Logger } from './lib-log.js';
import * as world from './lib-world.js';

/** @param {IGame} ns */
export async function main(ns) {
    let map = world.map(ns);
    let log = new Logger(ns, { termInfo: true });

    /**
     * @param {string[]} sources
     * @param {world.Server} current
     * @returns {world.Server[][]}
     */
    function paths(sources, current) {
        log.debug("sources:");
        for (let source of sources) {
            log.debug('..' + source);
        }
        log.debug("current:");
        log.debug('..' + current.name);

        let links = current.links.filter(s => !sources.includes(s));
        log.debug("links:");
        for (let link of links) {
            log.debug('..' + link);
        }

        let results = [[current]];
        if (links.length > 0) {
            for (let link of links) {
                if (typeof link == 'undefined') {
                    log.error('undefined link in collection');
                    ns.exit();
                }

                let next = map[link];
                if (typeof next == 'undefined') {
                    log.debug('no mapped server found for host ' + next);
                } else {
                    let ps = paths(sources.concat([current.name]), next);
                    if (typeof ps == 'undefined') {
                        log.error('no return value from paths()');
                        ns.exit();
                    }

                    for (let p of ps) {
                        results.push([current].concat(p));
                    }
                }
            }
        }

        log.debug("results:");
        for (let result of results) {
            log.debug('..' + result);
        }

        return results;
    }

    /**
     * @param {world.Server} target
     * @returns {world.Server[]}
     */
    function find(target) {
        let allPaths = paths([], world.home(ns));
        return allPaths.filter(ps => ps[ps.length-1] == target)[0];
    }

    /**
     * @param {string} name
     * @param {string} host
     */
    function findFaction(name, host) {
        let path = '';
        for (let p of find(map[host])) {
            if (path !== '') {
                path = `${path}; connect ${p.name}`;
            } else {
                path = `connect ${p.name}`;
            }
        }

        if (name === 'Icarus') {
            log.info(`${name}: ${path}; connect w0r1d_d43m0n; run BruteSSH.exe; run FTPCrack.exe; run relaySMTP.exe; run SQLInject.exe; run HTTPWorm.exe; run NUKE.exe; hack`);
        } else {
            log.info(`${name}: ${path}; hack`);
        }
        
        log.info('');
    }

    findFaction("CyberSec", "CSEC");
    findFaction("NiteSec", "avmnite-02h");
    findFaction("The Black Hand", "I.I.I.I");
    findFaction("BitRunners", "run4theh111z");
    findFaction("Icarus", "The-Cave");
    findFaction("Fulcrum", "fulcrumassets");
}