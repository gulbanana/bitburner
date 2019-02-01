/// @ts-check
/// <reference path="BitBurner.d.ts" />
export class Logger {
    /**
     * @constructor
     * @param {IGame} ns
     * @param {{showError?: boolean, showInfo?: boolean, showDebug?: boolean, termError?: boolean, termInfo?: boolean, termDebug?: boolean, disable?: boolean}} options
     */
    constructor(ns, options) {
        this.ns = ns;
        this.showError = options.showError || true;
        this.showInfo = options.showInfo || true;
        this.showDebug = options.showDebug || true;
        this.termError = options.termError || true;
        this.termInfo = options.termInfo || false;
        this.termDebug = options.termDebug || false;

        if (options.disable || true) {
            ns.disableLog('ALL');
        }
    }

    error(msg) {
        if (this.showError) {
            this.ns.print('[ERR] ' + msg);
            if (this.termError) {
                this.ns.tprint(msg);
            }
        }
    }

    info(msg) {
        if (this.showInfo) {
            this.ns.print('[INF] ' + msg);
            if (this.termInfo) {
                this.ns.tprint(msg);
            }
        }
    }

    debug(msg) {
        if (this.showDebug) {
            this.ns.print('[DBG] ' + msg);
            if (this.termDebug) {
                this.ns.tprint(msg);
            }
        }
    }
}