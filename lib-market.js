/// <reference path="BitBurner.d.ts" />
/// <reference path="Stock.d.ts" />

/** 
 * @param {IGame} ns
 * @param {string} sym 
 * @returns {StockPosition}
 */
export function getPosition(ns, sym) {
    let raw = ns.getStockPosition(sym);
    return {
        shares: raw[0],
        avgPx: raw[1],
        sharesShort: raw[2],
        avgPxShort: raw[3],
    };
}

/** 
 * @param {IGame} ns
 * @param {string} sym 
 * @returns {Stock}
 */
export function getStock(ns, sym) {
    /** @type {Stock} */
    let stock = {};
    stock.symbol = sym;
    stock.price = ns.getStockPrice(sym);
    stock.position = getPosition(ns, sym);
    stock.volatility = ns.getStockVolatility(sym);
    stock.forecast = ns.getStockForecast(sym);
    return stock;
}

/** 
 * @param {IGame} ns
 * @returns {Stock[]}
 */
export function getAll(ns) {
    let stocks = [];
    for (let s of ns.getStockSymbols())
    {
        let stock = getStock(ns, s);
        stocks.push(stock);
        stocks[s] = stock;
    }
    stocks.sort((a, b) => a.symbol.localeCompare(b.symbol));
    return stocks;
}