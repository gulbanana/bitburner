import { Logger } from './lib-log.js';
import * as servers from './lib-servers.js';

/** @param {IGame} ns */
export async function main(ns) {
    let map = servers.map(ns);
    let log = new Logger(ns, { termInfo: true });

    /**
     * @param {string[]} sources
     * @param {servers.Server} current
     * @returns {servers.Server[][]}
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
     * @param {servers.Server} target
     * @returns {servers.Server[]}
     */
    function find(target) {
        let allPaths = paths([], servers.home(ns));
        return allPaths.filter(ps => ps[ps.length-1] == target)[0];
    }

    /**
     * @param {string} name
     * @param {string} host
     */
    function findFaction(name, host) {
        let path = '';
        for (let p of find(map[host])) {
            path = path + ' -> ' + p.name;
        }

        log.info(`${name}: ${path}`);
    }

    findFaction("CyberSec", "CSEC");
    findFaction("NiteSec", "avmnite-02h");
    findFaction("The Black Hand", "I.I.I.I");
    findFaction("BitRunners", "run4theh111z");
}