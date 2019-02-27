/// <reference path="BitBurner.d.ts" />
import * as format from './lib-format.js';
import { enrol } from './lib-world.js';
import { Logger } from './lib-log.js';

export const TICK_SECONDS =             20;
const STOCK_MARKET_MIN =         100000000;
const HACKNET_BUYS_MAX =       10000000000;
const PURCHASED_SERVER_PRICE = 22528000000;
const PURCHASED_SERVER_RAM =         16384;

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
        this.lastBots = this.ns.getPurchasedServers().filter(b => this.ns.getServerRam(b)[0] >= PURCHASED_SERVER_RAM).length;
        this.beganMS = this.msRunning();
        this.beganDH = this.beganMS || this.dhRunning();
        this.beganFarm = false;

        // this costs an extra 4.5GB of ram :(
        this.marketAccess = false;
        try
        {
            let symbols = ns.getStockSymbols();
            ns.getStockVolatility(symbols[0]);
            this.marketAccess = true;
        }
        catch (error) { }
        log.debug('market access: ' + this.marketAccess);
    }

    // singularity functions available with various levels of Source-File 4
    tickDarkwebPurchases() { }
    tickPerformWork() { }
    tickUpgradeHomeSystem() { }
    tickAcceptInvites() { }
    tickJoinFactions() { }

    async tick() {
        this.skill = this.ns.getHackingLevel();
        this.cash = this.getCash();
        this.cashRate = (this.cash - this.lastCash) / (this.nextTickLength / 1000);
        this.nextTickLength = TICK_SECONDS * 1000;

        this.tickDarkwebPurchases();
        this.tickUpgradeHomeSystem();
        this.tickAcceptInvites();
        await this.tickManageScripts();
        this.tickPerformWork();

        this.lastCash = this.getCash();
        return this.nextTickLength;
    }

    async tickManageScripts() {
        // in the early game, buy a bunch of Hacknet nodes
        if (this.shouldBuyNodes()) {
            await this.ensureRunning('buy-nodes.js');
        } else {
            await this.ensureKilled('buy-nodes.js');
        }

        // once able to buy good enough servers for MS, switch to buying those
        let bots = this.ns.getPurchasedServers().filter(b => this.ns.getServerRam(b)[0] >= PURCHASED_SERVER_RAM).length;
        let botCost = this.ns.getPurchasedServerCost(PURCHASED_SERVER_RAM);
        let botLimit = this.ns.getPurchasedServerLimit();
        if (this.cash >= botCost && bots < botLimit) {
            this.log.info(`${bots} ${format.ram(PURCHASED_SERVER_RAM)} servers owned; ordering a new one for ${format.money(botCost)}`);
            await this.ns.exec('buy-servers.js', this.ns.getHostname(), 1, [bots+1])
        }

        // before we can afford a server farm, use DH
        if (bots == 0) {
            if (!this.beganDH) {
                this.log.info('begin distributed-hack architecture');
                this.beganDH = true;
            }

            if (!this.dhRunning()) {
                if (await this.dhStart()) {
                    this.lastEval = this.skill;
                }
            } else if (this.skill / this.lastEval > 1.1) {
                await this.dhStop();
                await this.ns.sleep(10 * 1000);
                if (await this.dhStart()) {
                    this.lastEval = this.skill;
                }
            }
            
        // once a server farm is available, use MS
        } else {
            if (!this.beganMS) { // based on an msRunning check, but only once at init startup
                this.log.info('begin mega-server architecture');
                this.beganMS = true;
                if (await this.msStart()) {
                    this.lastEval = this.skill;
                    this.lastBots = bots;
                }
            }

            if (this.skill / this.lastEval > 1.1 || bots > this.lastBots) {
                if (this.skill / this.lastEval > 1.1) {
                    this.log.debug(`skill ${this.skill} / lastEval ${this.lastEval} > 1.1`);
                }
                if (bots > this.lastBots) {
                    this.log.debug(`bots ${bots} > lastBots ${this.lastBots}`);
                }

                await this.msStop();
                await this.ns.sleep(10 * 1000);
                if (await this.msStart()) {
                    this.lastEval = this.skill;
                    this.lastBots = bots;
                }
            } 
        }

        // assume that everyone with enough to buy stock market access has done so
        if (this.marketAccess && this.cash >= STOCK_MARKET_MIN) {
            await this.ensureRunning('hft.js');
        }

        // use spare ram to farm hacking skill, unless farming it via bots
        if (bots == 0) {
            let target = 'foodnstuff';

            if (this.ns.scriptRunning('dh-control.js', this.ns.getHostname())) {
                let top = this.ns.ps(this.ns.getHostname());
                let p = top.find(p => p.filename == 'dh-control.js');
                target = p.args[0];
            }
            
            if (!this.beganFarm) {
                enrol(this.ns, target);
                this.beganFarm = true;
            }
            
            this.ensureRunning1('farm-worker.js', target, true);
        } else if (this.beganFarm) {
            this.ensureKilled('farm-worker.js');
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
     * @param {boolean} [maxThreads]
     * @param {string} arg
     */
    async ensureRunning1(script, arg, maxThreads) {
        let threads = 1;
        if (maxThreads) {
            threads = this.getMaxThreads(script);
            if (threads <= 0) return;
        }

        if (!this.ns.isRunning(script, 'home', arg)) {
            let threads = 1;
            if (maxThreads) {
                threads = this.getMaxThreads(script);
            }
    
            await this.ns.exec(script, 'home', threads, arg);
            this.log.info(`started ${script} (${threads} threads)`);
        } else {
            let top = this.ns.ps('home');
            let p = top.find(s => s.filename == script && s.args[0] == arg);
                
            if (!p || p.threads != threads) {
                await this.ensureKilled(script);
                await this.ensureRunning1(script, arg, maxThreads);
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
        let available = this.getFreeRam() - 64; // keep a bunch for maintenance scripts
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
        let server1 = 'bot0'; // servers[0]; - wrong because it changes
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
    
    /**********/
    /* policy */
    /**********/

    shouldBuyNodes() {
        return this.cash <= HACKNET_BUYS_MAX;
    }
}