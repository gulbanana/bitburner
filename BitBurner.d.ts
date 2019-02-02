declare interface IHackingMultipliers {
    chance: number,
    speed: number,
    money: number,
    growth: number
}

declare interface IHacknetMultipliers {
    production: number,
    purchaseCost: number,
    ramCost: number,
    coreCost: number,
    levelCost: number
}

declare interface IBitNodeMultipliers {
    ServerMaxMoney: number,
    ServerStartingMoney: number,
    ServerGrowthRate: number,
    ServerWeakenRate: number,
    ServerStartingSecurity: number,
    ManualHackMoney: number,
    ScriptHackMoney: number,
    CompanyWorkMoney: number,
    CrimeMoney: number,
    HacknetNodeMoney: number,
    CompanyWorkExpGain: number,
    ClassGymExpGain: number,
    FactionWorkExpGain: number,
    HackExpGain: number,
    CrimeExpGain: number,
    FactionWorkRepGain: number,
    FactionPassiveRepGain: number,
    AugmentationRepCost: number,
    AugmentationMoneyCost: number,
}

declare interface IHacknet {
    /** 
     * Returns the number of Hacknet Nodes you own. 
     */
    numNodes(): number;

    /**
     * Purchases a new Hacknet Node. Returns a number with the index of the Hacknet Node. This index is equivalent to the number at the end of the Hacknet Node’s name (e.g The Hacknet Node named ‘hacknet-node-4’ will have an index of 4).
     * If the player cannot afford to purchase a new Hacknet Node then the function will return -1.
     */
    purchaseNode(): void;

    /**
     * Returns the cost of purchasing a new Hacknet Node.
     */
    getPurchaseNodeCost(): number;

    /**
     * Tries to upgrade the level of the specified Hacknet Node by n.
     * Returns true if the Hacknet Node’s level is successfully upgraded by n or if it is upgraded by some positive amount and the Node reaches its max level.
     * Returns false otherwise.
     */
    upgradeLevel(i: number, n: number): boolean;

    /**
     * Tries to upgrade the specified Hacknet Node’s RAM n times. Note that each upgrade doubles the Node’s RAM. So this is equivalent to multiplying the Node’s RAM by 2 n.
     * Returns true if the Hacknet Node’s RAM is successfully upgraded n times or if it is upgraded some positive number of times and the Node reaches it max RAM.
     * Returns false otherwise.
     */
    upgradeRam(i: number, n: number): boolean;

    /**
     * Tries to purchase n cores for the specified Hacknet Node.
     * Returns true if it successfully purchases n cores for the Hacknet Node or if it purchases some positive amount and the Node reaches its max number of cores.
     * Returns false otherwise.
     */
    upgradeCore(i: number, n: number): boolean;

    /**
     * Returns the cost of upgrading the specified Hacknet Node by n levels.
     * If an invalid value for n is provided, then this function returns 0. If the specified Hacknet Node is already at max level, then Infinity is returned.
     */
    getLevelUpgradeCost(i: number, n: number): number;

    /**
     * Returns the cost of upgrading the RAM of the specified Hacknet Node n times.
     * If an invalid value for n is provided, then this function returns 0. If the specified Hacknet Node is already at max RAM, then Infinity is returned.
     */
    getRamUpgradeCost(i: number, n: number): number;

    /**
     * Returns the cost of upgrading the number of cores of the specified Hacknet Node by n.
     * If an invalid value for n is provided, then this function returns 0. If the specified Hacknet Node is already at the max number of cores, then Infinity is returned.
     */
    getCoreUpgradeCost(i: number, n: number): number;
}

declare interface IHacknetNode {
    name: string;
    level: number;
    ram: number;
    cores: number;
    totalMoneyGenerated: number;
    onlineTimeSeconds: number;
    moneyGainRatePerSecond: number;

    upgradeLevel(levels: number): boolean;
    upgradeRam(): boolean;
    upgradeCore(): boolean;
    getLevelUpgradeCost(levels: number): number;
    getRamUpgradeCost(): number;
    getCoreUpgradeCost(): number;
}

declare interface IGame {
    args: any[];
    hacknet: IHacknet;
    hacknetnodes: IHacknetNode[];

    hack(hostname: string): Promise<number>;

    grow(hostname: string): Promise<number>;

    weaken(hostname: string): Promise<number>;

    /**
     * Suspends the script for n milliseconds.
     * @param milliseconds Number of milliseconds to sleep
     */
    sleep(milliseconds: number): Promise<void>;

    /**
     * Returns the chance you have of successfully hacking the specified server. This returned value is in decimal form, not percentage.
     * @param host IP or hostname of target server
     * @returns The chance you have of successfully hacking the target server
     */
    hackChance(host: string): number;

    /**
     * Returns the percentage of the specified server’s money you will steal with a single hack. This value is returned in percentage form, not decimal (Netscript functions typically return in decimal form, but not this one).
     * @param host IP or hostname of target server
     * @returns The percentage of money you will steal from the target server with a single hack
     */
    hackAnalyzePercent(host: string): number;

    /** 
     * Prints a value or a variable to the script’s logs. 
     */
    print(data: any): void;

    tprint(data: any): void;
    clearLog(): void;

    /**
     * Disables logging for the given function. Logging can be disabled for all functions by passing ‘ALL’ as the argument.
     * Note that this does not completely remove all logging functionality. This only stops a function from logging when the function is successful. If the function fails, it will still log the reason for failure.
     * Notable functions that cannot have their logs disabled: run, exec, exit
     * @param fn Name of function for which to disable logging
     */
    disableLog(fn: string): void;
    enableLog(fn: string): void;
    scan(hostname: string, useHostnames?: boolean): string[];
    nuke(hostname: string): void;
    brutessh(hostname: string): void;
    ftpcrack(hostname: string): void;
    relaysmtp(hostname: string): void;
    httpworm(hostname: string): void;
    sqlinject(hostname: string): void;
    run(script: string, numThreads?: number, ...args: any[]): Promise<boolean>;
    exec(script: string, hostname: string, numThreads?: number, ...args: any[]): Promise<boolean>;
    spawn(script: string, numThreads?: number, ...args: any[]): boolean;
    kill(script: string, hostname: string, ...args: any[]): boolean;
    killall(hostname: string): boolean;
    exit(): void;
    scp(file: string, destination: string): boolean;
    scp(files: string[], destination: string): boolean;
    scp(file: string, source: string, destination: string): boolean;
    scp(files: string[], source: string, destination: string): boolean;
    ls(hostname: string, patter: string): string[];
    hasRootAccess(hostname: string): boolean;
    getHostname(): string;
    getHackingLevel(): number;
    getHackingMultipliers(): IHackingMultipliers;
    getHacknetMultipliers(): IHacknetMultipliers;
    getServerMoneyAvailable(hostname: string): number;
    getServerMaxMoney(hostname: string): number;
    getServerGrowth(hostname: string): number;
    getServerSecurityLevel(hostname: string): number;
    getServerBaseSecurityLevel(hostname: string): number;
    getServerMinSecurityLevel(hostname: string): number;
    getServerRequiredHackingLevel(hostname: string): number;
    getServerNumPortsRequired(hostname: string): number;
    
    /**
     * Returns an array with two elements that gives information about a server’s memory (RAM). The first element in the array is the amount of RAM that the server has total (in GB). The second element in the array is the amount of RAM that is currently being used on the server (in GB).
     * @param hostname Hostname or IP of target server
     */
    getServerRam(hostname: string): [ number, number ];
    
    serverExists(hostname: string): boolean;
    fileExists(filename: string, hostname?: string): boolean;
    isRunning(script: string, hostname: string, ...args: any[]): boolean;
    getNextHacknetNodeCost(): number;
    purchaseHacknetNode(): number | false;
    purchaseServer(hostname: string, ram: number): string;
    deleteServer(hostname: string): boolean;
    getPurchasedServers(useHostnames?: boolean): string[];
    write(file: string, data?: string, mode?: string): void;
    write(port: number, data?: string): void;
    read(file: string): string;
    read(port: number): string;
    peek(port: number): string;
    clear(file: string): void;
    clear(port: number): void;
    rm(file: string): boolean;
    
    /**
     * Returns a boolean indicating whether any instance of the specified script is running on the target server, regardless of its arguments.
     * This is different than the isRunning() function because it does not try to identify a specific instance of a running script by its arguments.
     * @param script Filename of script to check. This is case-sensitive.
     * @param hostname Hostname or IP of target server
     */
    scriptRunning(script: string, hostname: string): boolean;
    
    scriptKill(script: string, hostname: string): boolean;
    getScriptName(): string;
    getScriptRam(script: string, hostname?: string): number;
    getHackTime(hostname: string): number;
    getGrowTime(hostname: string): number;
    getWeakenTime(hostname: string): number;
    getScriptIncome(): [ number, number ];
    getScriptIncome(script: string, hostname: string, ...args: any[]): number;
    getScriptExpGain(): [ number, number ];
    getScriptExpGain(script: string, hostname: string, ...args: any[]): number;
    getTimeSinceLastAug(): number;
    prompt(text: string): Promise<boolean>;
    getBitNodeMultipliers(): IBitNodeMultipliers;
}
