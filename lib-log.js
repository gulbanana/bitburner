/// <reference path="BitBurner.d.ts" />
export class Logger {
    /**
     * @constructor
     * @param {IGame} ns
     * @param {{showError?: boolean, showInfo?: boolean, showDebug?: boolean, termError?: boolean, termInfo?: boolean, termDebug?: boolean, disable?: boolean}} options
     */
    constructor(ns, options) {
        this.ns = ns;
        this.showError = typeof options.showError !== 'undefined' ? options.showError : true;
        this.showInfo = typeof options.showInfo !== 'undefined' ? options.showInfo : true;
        this.showDebug = typeof options.showDebug !== 'undefined' ? options.showDebug : true;
        this.termError = typeof options.termError !== 'undefined' ? options.termError : true;
        this.termInfo = typeof options.termInfo !== 'undefined' ? options.termInfo : false;
        this.termDebug = typeof options.termDebug !== 'undefined' ? options.termDebug : false;

        if (typeof options.disable !== 'undefined' ? options.disable : true) {
            ns.disableLog('ALL');
        }
    }

    /** @param {string} msg */
    error(msg) {
        if (this.showError) {
            this.ns.print('[ERR] ' + msg);
            if (this.termError) {
                this.ns.tprint(msg);
            }
        }
    }

    /** @param {string} msg */
    info(msg) {
        if (this.showInfo) {
            this.ns.print('[INF] ' + msg);
            if (this.termInfo) {
                this.ns.tprint(msg);
            }
        }
    }

    /** @param {string} msg */
    debug(msg) {
        if (this.showDebug) {
            this.ns.print('[DBG] ' + msg);
            if (this.termDebug) {
                this.ns.tprint(msg);
            }
        }
    }
}