import * as format from './lib-format.js';
import { Logger } from './lib-log.js';
import { Augmentation, FactionWithAugs } from './lib-life-L3.js';
import { FAVOUR_MAX } from './lib-life-L2.js';

/** @param {IGame} ns */
export async function main(ns) {
    let log = new Logger(ns, {});

    let facsByRep = FactionWithAugs.getAll(ns)
        .sort((a, b) => b.reputation - a.reputation);

    /** @type {{[key: string]: FactionWithAugs}} */
    let facsByName = {};
    for (let f of facsByRep) {
        facsByName[f.name] = f;
    }

    let augsByPrice = facsByRep
        .map(f => f.augmentations)
        .reduce((a, b) => a.concat(b), [])
        .filter(a => !a.owned)
        .sort((a, b) => b.price - a.price);

    ns.tprint('----- LOCKED -----');
    let locked = augsByPrice.filter(a => facsByName[a.faction].reputation < a.requiredReputation);
    for (let aug of groupAugs(locked)) {
        let facs = aug.factions.map(name => {
            let f = facsByName[name];
            if (f.favor + f.favorGain >= FAVOUR_MAX) {
                if (f.favor >= FAVOUR_MAX) {
                    return `${name} (donate)`;
                } else {
                    return `${name} (reset)`;
                }
            } else {
                let diff = Math.floor(aug.requiredReputation - f.reputation);
                return `${name} (+${diff})`;
            }
        });
        ns.tprint(`${format.money(aug.price).padEnd(20)} ${aug.name.padEnd(50)} [${facs}]`)
    }

    ns.tprint('----- UNLOCKED -----');
    let unlocked = augsByPrice.filter(a => facsByName[a.faction].reputation >= a.requiredReputation);
    for (let aug of groupAugs(unlocked)) {
        ns.tprint(`${format.money(aug.price).padEnd(20)} ${aug.name.padEnd(50)} [${aug.factions}]`)
    }
}

/** @param {Augmentation[]} augs */
function groupAugs(augs) {
    /** @type {{name: string, factions: string[], price: number, requiredReputation: number}[]} */
    let augsWithFacs = [];
    for (let a of augs) {
        if (!augsWithFacs.hasOwnProperty(a.name)) {
            augsWithFacs[a.name] = {
                factions: [],
                name: a.name,
                price: a.price,
                requiredReputation: a.requiredReputation
            };
            augsWithFacs.push(augsWithFacs[a.name]);
        } 

        augsWithFacs[a.name].factions.push(a.faction);
    }
    return augsWithFacs;
}