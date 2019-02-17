/// <reference path="BitBurner.d.ts" />
import { Logger } from './lib-log.js';

export let TICK_LENGTH =  20; // seconds
let STOCK_MARKET_MIN =         10000000;
let HACKNET_BUYS_MAX =      10000000000;
let PURCHASED_SERVERS_MIN = 22528000000;

export class LifeL0 {
    /** 
     * @param {IGame} ns 
     * @param {Logger} log
     */
    constructor(ns, log) {
        this.ns = ns;
        this.log = log;
        this.lastEval = ns.getHackingLevel();
        this.lastCash = this.getCash();
        this.beganMS = this.msRunning();
        this.beganDH = this.beganMS || this.dhRunning();

        // this costs an extra 4.5GB of ram :(
        this.marketAccess = false;
        try
        {
            let symbols = ns.getStockSymbols();
            ns.getStockVolatility(symbols[0]);
            this.marketAccess = true;
        }
        catch (error) { }
    }

    // singularity functions available with various levels of Source-File 4
    tickDarkwebPurchases() { }
    tickPerformWork() { }
    tickUpgradeHomeSystem() { }
    tickJoinFactions() { }

    async tick() {
        this.cash = this.getCash();
        this.cashRate = (this.cash - this.lastCash) / TICK_LENGTH;
        this.skill = this.ns.getHackingLevel();

        this.tickDarkwebPurchases();
        this.tickUpgradeHomeSystem();
        this.tickJoinFactions();
        await this.tickManageScripts();
        this.tickPerformWork();

        this.lastCash = this.getCash();
    }

    async tickManageScripts() {
        let hasBots = this.ns.getPurchasedServers().length > 0;

        // in the early game, buy a bunch of Hacknet nodes
        if (this.cash < HACKNET_BUYS_MAX) {
            await this.ensureRunning('buy-nodes.js');
        } else if (this.cash >= HACKNET_BUYS_MAX) {
            await this.ensureKilled('buy-nodes.js');
        }

        // before we can afford a server farm, use DH
        if (!this.beganDH || (this.cash < PURCHASED_SERVERS_MIN && !this.beganMS)) {
            if (!this.beganDH) {
                this.log.info('begin distributed-hack architecture');
                this.beganDH = true;
            }

            if (!this.dhRunning()) {
                if (await this.dhStart()) {
                    this.lastEval = this.skill;
                }
            } else if (this.skill / this.lastEval > 1.1) {
                if (await this.dhStop() && await this.dhStart()) {
                    this.lastEval = this.skill;
                }
            }
            
        // once a server farm is available, use MS
        } else {
            if (!this.beganMS) {
                this.log.info('begin mega-server architecture');
                this.beganMS = true;
            }

            // precondition: actually buy the servers
            if (!hasBots) {
                await this.runOnce('buy-servers.js');
            }

            // precondition: shut down DH (also gives time for the server-buy to go through)
            if (this.dhRunning()) {
                await this.dhStop();
            }

            if (!this.msRunning()) {
                if (await this.msStart()) {
                    this.lastEval = this.skill;
                }
            } else if (this.skill / this.lastEval > 1.1) {
                if (await this.msStop() && await this.msStart()) {
                    this.lastEval = this.skill;
                }
            }
        }

        // assume that everyone with enough to buy stock market access has done so
        if (this.marketAccess && this.cash >= STOCK_MARKET_MIN) {
            await this.ensureRunning('hft.js');
        }

        // use spare ram to farm hacking skill, unless farming it via bots
        if (!hasBots) {
            this.ensureRunning('farm-worker.js', true);
        }
    }

    /********************/
    /* script utilities */
    /********************/

    /**
     * @param {string} script
     * @param {boolean} [maxThreads=false]
     */
    async ensureRunning(script, maxThreads) {
        let threads = 1;
        if (maxThreads) {
            threads = this.getMaxThreads(script);
            if (threads <= 0) return;
        }

        if (!this.ns.scriptRunning(script, 'home')) {
            let threads = 1;
            if (maxThreads) {
                threads = this.getMaxThreads(script);
            }
    
            await this.ns.exec(script, 'home', threads);
            this.log.info(`started ${script} (${threads} threads)`);
        } else {
            let top = this.ns.ps('home');
            let p = top.find(s => s.filename == script);
            if (p.threads != threads) {
                await this.ensureKilled(script);
                await this.ensureRunning(script, maxThreads);
            }
        }
    }

    /**
     * @param {string} script
     */
    async ensureKilled(script) {
        let killed = false;
        while (this.ns.scriptRunning(script, 'home')) {
            if (!killed) {
                killed = this.ns.scriptKill(script, 'home');
                if (killed) {
                    this.log.info('stopped ' + script);
                } else {
                    this.log.error('failed to kill script ' + script + 'on home');
                    return;    
                }
            }

            await this.ns.sleep(1000);
        }
    }
    
    /** @param {string} script */
    async runOnce(script) {
        if (!this.ns.isRunning(script, 'home')) {
            await this.ns.exec(script, 'home', 1);
            this.log.info(`started ${script}`);
        }
    }

    /******************/
    /* info utilities */
    /******************/

    getCash() {
        return this.ns.getServerMoneyAvailable('home');
    }

    getFreeRam() {
        let ram = this.ns.getServerRam('home');
        return ram[0] - ram[1];
    }

    /** @param {string} script */
    getMaxThreads(script) {
        let available = this.getFreeRam() - 32; // keep a bunch for maintenance scripts
        let cost = this.ns.getScriptRam(script, 'home');
        return Math.floor(available / cost);
    }

    /******************************/
    /* hack architecture controls */
    /******************************/
    resetHackEval() {
        this.lastEval = 1;
    }

    dhRunning() {
        return this.ns.scriptRunning('dh-control.js', 'home');
    }
    
    async dhStart() {
        this.log.debug('starting distributed-hack architecture');
        return await this.ns.exec('dh-eval.js', 'home', 1, 'autostart');
    }

    async dhStop() {
        if (this.getFreeRam() < this.ns.getScriptRam('dh-stop.js')) {
            await this.ensureKilled('dh-control.js');
        }

        this.log.debug('stopping distributed-hack architecture');
        return await this.ns.exec('dh-stop.js', 'home', 1);
    }

    msRunning() {
        let servers = this.ns.getPurchasedServers();
        if (servers.length == 0) return false;
        let server1 = servers[0];
        let top = this.ns.ps(server1);
        if (top.length == 0) return false;
        return top[0].filename.startsWith('ms');
    }

    async msStart() {
        this.log.debug('starting mega-server architecture');
        return await this.ns.exec('ms-eval.js', 'home', 1, 'autostart');
    }

    async msStop() {
        this.log.debug('stopping mega-server architecture');
        return await this.ns.exec('ms-stop.js', 'home', 1);
    }
}