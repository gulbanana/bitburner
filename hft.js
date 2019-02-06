/// <reference path="hft.d.ts" />
import { Logger } from './lib-log.js';
import * as format from './lib-format.js';

/** @param {IGame} ns */
export async function main(ns) {
    let dryRun = ns.args.includes('dry') || ns.args.includes('dryrun') || ns.args.includes('dry-run');
    let log = new Logger(ns, { });

    /** 
     * @param {string} sym 
     * @returns {StockPosition}
     */
    function getPosition(sym) {
        let raw = ns.getStockPosition(sym);
        return {
            shares: raw[0],
            avgPx: raw[1],
            sharesShort: raw[2],
            avgPxShort: raw[3],
        };
    }

    /** 
     * @param {string} sym 
     * @returns {Stock}
     */
    function getStock(sym) {
        /** @type {Stock} */
        let stock = {};
        stock.symbol = sym;
        stock.price = ns.getStockPrice(sym);
        stock.position = getPosition(sym);
        stock.volatility = ns.getStockVolatility(sym);
        stock.forecast = ns.getStockForecast(sym);
        return stock;
    }

    /** @type {Stock[]} */
    let stocks = [];
    for (let s of ns.getStockSymbols())
    {
        stocks.push(getStock(s));
    }

    for (let s of stocks) {
        ns.tprint(`${s.symbol}: ${format.money(s.price)} - ${format.decper(s.forecast)} inc, ${format.decper(s.volatility)} vol`)
    }
} 