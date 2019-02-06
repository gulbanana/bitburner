import { Logger } from './lib-log.js';
import * as format from './lib-format.js';
import * as market from './lib-market.js';

/** @param {IGame} ns */
export async function main(ns) {
    let dryRun = ns.args.includes('dry');
    let debug = ns.args.includes('debug');
    let log = new Logger(ns, { showDebug: debug });

    let commission = 100000;
    let peaks = {};
    let profit = 0;

    let lastTime = Date.now();
    let lastAssets = 0;

    function tick() {
        let time = Date.now();
        let stocks = market.getAll(ns);
        
        // there are 33 stocks available, but we're assuming we won't be in all of them at once
        let cash = ns.getServerMoneyAvailable('home');
        log.debug(`cash assets: ${format.money(cash)}`);

        let assets = 0;
        for (let stock of stocks) {
            assets = assets + stock.position.shares * stock.price;
        }
        log.debug(`stock assets: ${format.money(assets)}`);

        let budget = (cash + assets) * 0.1;
        log.debug(`budget: ${format.money(budget)} per stock`);

        // calculate current and desired positions        
        for (let stock of stocks) {
            stock.hftPosition = stock.position.shares * stock.price;

            // currently holding
            if (stock.position.shares) {
                peaks[stock.symbol] = peaks[stock.symbol] || stock.position.avgPx;

                // keep a stop at 5% below peak
                if (stock.price > peaks[stock.symbol]) {
                    peaks[stock.symbol] = stock.price;
                } 
                
                // sell when stop reached
                if (stock.price <= peaks[stock.symbol] * 0.95) {
                    log.debug(`${format.stock(stock)}: reached stop, sell`);
                    stock.hftTarget = 0;
                }

                // sell when sentiment is bad
                else if (stock.forecast <= 0.4) {
                    log.debug(`${format.stock(stock)}: forecast --, sell`);
                    stock.hftTarget = 0;
                }

                // buy more when sentiment is good
                else if (stock.forecast >= 0.6) {
                    log.debug(`${format.stock(stock)}: forecast ++, hold or buy up to budget`);
                    stock.hftTarget = Math.max(stock.hftPosition, budget);
                }

                // profit-take when budget exceeded and position neutral
                else {
                    log.debug(`${format.stock(stock)}: forecast neutral, position ${format.money(stock.hftPosition)}, buy or sell to budget`);
                    stock.hftTarget = Math.min(stock.hftPosition, budget)
                }
            }

            // not holding, buy if sentiment is good 
            else if (stock.forecast >= 0.6) {
                log.debug(`${format.stock(stock)}: forecast ++, buy`);
                stock.hftTarget = budget;
            }

            else {
                stock.hftTarget = stock.hftPosition;
            }
        }

        // buy and sell to change positions
        let transacted = false;
        for (let stock of stocks) {
            if (stock.hftTarget > stock.hftPosition && stock.position.shares < stock.maxShares) {
                let diff = stock.hftTarget - stock.hftPosition;
                let shares = Math.floor(diff / stock.price);
                let total = shares * stock.price;

                if (total > commission * 1000) {
                    log.info(`${format.stock(stock)}: buy ${shares} (${format.money(total)})`);

                    if (!dryRun) {
                        let purchasePrice = ns.buyStock(stock.symbol, shares);
                        profit -= purchasePrice * shares;
                        transacted = true;
                    } 

                    peaks[stock.symbol] = stock.price;
                }
            } else if (stock.hftTarget < stock.hftPosition) {
                let diff = stock.hftPosition - stock.hftTarget;
                let shares = Math.ceil(diff / stock.price);
                let total = shares * stock.price;

                if (stock.hftTarget == 0 || total > commission * 1000) {
                    if (total <= commission * 1000) {
                        log.debug(`${format.stock(stock)}: emergency sale despite commission limit`);
                    }

                    log.info(`${format.stock(stock)}: sell ${shares} (${format.money(total)})`);

                    if (!dryRun) {
                        let salePrice = ns.sellStock(stock.symbol, shares);
                        profit += salePrice * shares;
                        transacted = true;
                    } 

                    peaks[stock.symbol] = undefined;
                }
            }
        }

        if (transacted) {
            log.info(`assets: ${format.money(assets)}, session capital gains: ${format.money(profit)}`);
            lastTime = time;
            assets = 0;
            for (let stock of stocks) {
                assets = assets + stock.position.shares * stock.price;
            }    
            lastAssets = assets;
        } else {
            let assetChange = assets - lastAssets;
            let timeChange = time - lastTime;
            log.info(`assets: ${format.money(assets)}, ${format.change(lastAssets, assets)}, ${format.money(assetChange/timeChange)}/sec`);
        }
    }

    while (true) {
        await ns.sleep(4000);
        tick();
    }
} 