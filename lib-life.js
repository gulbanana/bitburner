/// <reference path="BitBurner.d.ts" />
import { Logger } from './lib-log.js';

let HACKNET_BUYS_MAX =      10000000000;
let PURCHASED_SERVERS_MIN = 22528000000;
let STOCK_MARKET_MIN =      50000000000;

export class Life {
    /** 
     * @param {IGame} ns 
     * @param {Logger} log
     */
    constructor(ns, log) {
        this.ns = ns;
        this.log = log;
        this.lastEval = 1;
    }

    async tick() {
        let cash = this.getCash();
        let skill = this.ns.getHackingLevel();

        // in the early game, buy a bunch of Hacknet nodes
        if (cash < HACKNET_BUYS_MAX) {
            await this.ensureRunning('buy-nodes.js');
        } else if (cash >= HACKNET_BUYS_MAX) {
            await this.ensureKilled('buy-nodes.js');
        }

        // before we can afford a server farm, use DH
        if (cash < PURCHASED_SERVERS_MIN) {
            if (!this.dhRunning()) {
                if (await this.dhStart()) {
                    this.lastEval = skill;
                }
            } else if (skill / this.lastEval > 1.1) {
                if (await this.dhStop() && await this.dhStart()) {
                    this.lastEval = skill;
                }
            }
            
        // once a server farm is available, use MS
        } else {
            // precondition: actually buy the servers
            if (this.ns.getPurchasedServers().length == 0) {
                await this.runOnce('buy-servers.js');
            }

            // precondition: shut down DH (also gives time for the server-buy to go through)
            if (this.dhRunning()) {
                await this.dhStop();
            }

            if (!this.msRunning()) {
                if (await this.msStart()) {
                    this.lastEval = skill;
                }
            } else if (skill / this.lastEval > 1.1) {
                if (await this.msStop() && await this.msStart()) {
                    this.lastEval = skill;
                }
            }
        }

        // assume that everyone with enough to buy stock market access has done so
        if (cash >= STOCK_MARKET_MIN) {
            await this.ensureRunning('hft.js');
        }

        // use spare ram to farm hacking skill
        this.ensureRunning('farm-worker.js', true);
    }

    /***************************/
    /* general script controls */
    /***************************/

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
    
    /**
     * @param {string} script
     */
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

    getMaxThreads(script) {
        let available = this.getFreeRam() - 32; // keep a bunch for maintenance scripts
        let cost = this.ns.getScriptRam(script, 'home');
        return Math.floor(available / cost);
    }

    /******************************/
    /* hack architecture controls */
    /******************************/
    dhRunning() {
        return this.ns.scriptRunning('dh-control.js', 'home');
    }
    
    async dhStart() {
        this.log.info('starting distributed-hack architecture');
        return await this.ns.exec('dh-eval.js', 'home', 1, 'autostart');
    }

    async dhStop() {
        if (this.getFreeRam() < this.ns.getScriptRam('dh-stop.js')) {
            await this.ensureKilled('dh-control.js');
        }

        this.log.info('stopping distributed-hack architecture');
        return await this.ns.exec('dh-stop.js', 'home', 1);
    }

    msRunning() {
        return this.ns.ps('bot0').length > 0;
    }

    async msStart() {
        this.log.info('starting mega-server architecture');
        return await this.ns.exec('ms-eval.js', 'home', 1, 'autostart');
    }

    async msStop() {
        this.log.info('stopping mega-server architecture');
        return await this.ns.exec('ms-stop.js', 'home', 1);
    }
}