import * as format from './lib-format.js';
import { Logger } from './lib-log.js';
import { Faction, Augmentation } from './lib-life-virtual.js';

/** @param {IGame} ns */
export async function main(ns) {
    let log = new Logger(ns, {});

    let facsByRep = Faction.getAll(ns)
        .sort((a, b) => b.reputation - a.reputation);

    let facsByName = [];
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
        ns.tprint(`${format.money(aug.price).padEnd(20)} ${aug.name.padEnd(40)} [${aug.factions}]`)
    }

    ns.tprint('----- UNLOCKED -----');
    let unlocked = augsByPrice.filter(a => facsByName[a.faction].reputation >= a.requiredReputation);
    for (let aug of groupAugs(unlocked)) {
        ns.tprint(`${format.money(aug.price).padEnd(20)} ${aug.name.padEnd(40)} [${aug.factions}]`)
    }
}

/**
 * @param {Augmentation[]} augs 
 */
function groupAugs(augs) {
    /** @type {{name: string, factions: string[], price: number}[]} */
    let augsWithFacs = [];
    for (let a of augs) {
        if (!augsWithFacs.hasOwnProperty(a.name)) {
            augsWithFacs[a.name] = {};
            augsWithFacs[a.name].factions = [];
            augsWithFacs[a.name].name = a.name;
            augsWithFacs[a.name].price = a.price;
            augsWithFacs.push(augsWithFacs[a.name]);
        } 

        augsWithFacs[a.name].factions.push(a.faction);
    }
    return augsWithFacs;
}