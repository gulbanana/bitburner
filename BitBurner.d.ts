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
     * Returns an object containing a variety of stats about the specified Hacknet Node:
     * @param i Index/Identifier of Hacknet Node
     */
    getNodeStats(i: number): IHacknetNode;

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
    timeOnline: number;
    /** Node's money earned per second */
    production: number;
    totalProduction: number;
}

declare interface IGame {
    args: any[];
    hacknet: IHacknet;

    hack(hostname: string): Promise<number>;

    grow(hostname: string): Promise<number>;

    weaken(hostname: string): Promise<number>;

    /**
     * Suspends the script for n milliseconds.
     * @param milliseconds Number of milliseconds to sleep
     */
    sleep(milliseconds: number): Promise<void>;

    /**
     * This function returns the number of script threads you need when running the hack() command to steal the specified amount of money from the target server.
     * If hackAmount is less than zero or greater than the amount of money available on the server, then this function returns -1.
     * @param host IP or hostname of target server
     * @param hackAmount Amount of money you want to hack from the server
     * @returns The number of threads needed to hack() the server for hackAmount money
     */
    hackAnalyzeThreads(host: string, hackAmount: number): number;

    /**
     * Returns the chance you have of successfully hacking the specified server. This returned value is in decimal form, not percentage.
     * @param host IP or hostname of target server
     * @returns The chance you have of successfully hacking the target server
     */
    hackChance(host: string): number;

    /**
     * This function returns the number of “growths” needed in order to increase the amount of money available on the specified server by the specified amount.
     * The specified amount is multiplicative and is in decimal form, not percentage.
     * For example, if you want to determine how many grow() calls you need to double the amount of money on foodnstuff, you would use:
     * @param host IP or hostname of server to analyze
     * @param growthAmount Multiplicative factor by which the server is grown. Decimal form.
     * @returns The amount of grow() calls needed to grow the specified server by the specified amount
     */
    growthAnalyze(host: string, growthAmount: number): number;

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
    ps(host: string): {filename: string, threads: number, args: string[]}[];
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

    /**
     * Returns the cost to purchase a server with the specified amount of ram.
     * @param ram Amount of RAM of a potential purchased server. Must be a power of 2 (2, 4, 8, 16, etc.). Maximum value of 1048576 (2^20)
     */
    getPurchasedServerCost(ram: number): number;

    /**
     * Purchase a server with the specified hostname and amount of RAM.
     * The hostname argument can be any data type, but it will be converted to a string and have whitespace removed. Anything that resolves to an empty string will cause the function to fail. If there is already a server with the specified hostname, then the function will automatically append a number at the end of the hostname argument value until it finds a unique hostname. For example, if the script calls purchaseServer(“foo”, 4) but a server named “foo” already exists, the it will automatically change the hostname to “foo-0”. If there is already a server with the hostname “foo-0”, then it will change the hostname to “foo-1”, and so on.
     * Note that there is a maximum limit to the amount of servers you can purchase.
     * Returns the hostname of the newly purchased server as a string. If the function fails to purchase a server, then it will return an empty string. The function will fail if the arguments passed in are invalid, if the player does not have enough money to purchase the specified server, or if the player has exceeded the maximum amount of servers.
     * @param hostname Hostname of the purchased server
     * @param ram Amount of RAM of the purchased server. Must be a power of 2 (2, 4, 8, 16, etc.). Maximum value of 1048576 (2^20)
     */
    purchaseServer(hostname: string, ram: number): string;

    /**
     * Deletes one of your purchased servers, which is specified by its hostname.
     * The hostname argument can be any data type, but it will be converted to a string. Whitespace is automatically removed from the string. This function will not delete a server that still has scripts running on it.
     * Returns true if successful, and false otherwise.
     * @param hostname Hostname of the server to delete
     */
    deleteServer(hostname: string): boolean;

    /**
     * Returns an array with either the hostnames or IPs of all of the servers you have purchased.
     * @param useHostnames Specifies whether hostnames or IP addresses should be returned. If it’s true then hostnames will be returned, and if false then IPs will be returned. If this argument is omitted then it is true by default
     */
    getPurchasedServers(useHostnames?: boolean): string[];

    getPurchasedServerLimit(): number;

    getPurchasedServerMaxRam(): number;

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
    
    /*******/
    /* TIX */
    /*******/

    /**
     * Returns an array of the symbols of the tradable stocks
     */
    getStockSymbols(): string[];


    /**
     * Returns the price of a stock, given its symbol (NOT the company name). The symbol is a sequence of two to four capital letters.
     * @param sym Stock symbol
     */
    getStockPrice(sym: string): number;

    /**
     * Returns an array of four elements that represents the player’s position in a stock.
     * The first element is the returned array is the number of shares the player owns of the stock in the Long position. The second element in the array is the average price of the player’s shares in the Long position.
     * The third element in the array is the number of shares the player owns of the stock in the Short position. The fourth element in the array is the average price of the player’s Short position.
     * All elements in the returned array are numeric.
     * @param sym Stock symbol
     */
    getStockPosition(sym: string): [number, number, number, number];

    /**
     * Returns the maximum number of shares that the stock has. This is the maximum amount of the stock that can be purchased in both the Long and Short positions combined.
     * @param sym Stock symbol
     */
    getStockMaxShares(sym: string): number;

    /**
     * Attempts to purchase shares of a stock using a Market Order.
     * If the player does not have enough money to purchase the specified number of shares, then no shares will be purchased. Remember that every transaction on the stock exchange costs a certain commission fee.
     * @param sym Symbol of stock to purchase
     * @param shares Number of shares to purchase. Must be positive. Will be rounded to nearest integer
     * @returns If this function successfully purchases the shares, it will return the stock price at which each share was purchased. Otherwise, it will return 0.
     */
    buyStock(sym: string, shares: number): number;

    /**
     * Attempts to sell shares of a stock using a Market Order.
     * If the specified number of shares in the function exceeds the amount that the player actually owns, then this function will sell all owned shares. Remember that every transaction on the stock exchange costs a certain commission fee.
     * The net profit made from selling stocks with this function is reflected in the script’s statistics. This net profit is calculated as:
     * `shares * (sell price - average price of purchased shares)`
     * @param sym Symbol of stock to sell
     * @param shares Number of shares to sell. Must be positive. Will be rounded to nearest integer
     * @returns If the sale is successful, this function will return the stock price at which each share was sold. Otherwise, it will return 0.
     */
    sellStock(sym: string, shares: number): number;

    // shortStock

    // sellShort

    // placeOrder

    // cancelOrder

    // getOrders

    /******************/
    /* 4S market data */
    /******************/

    /**
     * Volatility represents the maximum percentage by which a stock’s price can change every tick. The volatility is returned as a decimal value, NOT a percentage (e.g. if a stock has a volatility of 3%, then this function will return 0.03, NOT 3).
     * In order to use this function, you must first purchase access to the Four Sigma (4S) Market Data TIX API.
     * @param sym Symbol of stock
     * @returns Returns the volatility of the specified stock.
     */
    getStockVolatility(sym: string): number;

    /**
     * The probability is returned as a decimal value, NOT a percentage (e.g. if a stock has a 60% chance of increasing, then this function will return 0.6, NOT 60).
     * In other words, if this function returned 0.30 for a stock, then this means that the stock’s price has a 30% chance of increasing and a 70% chance of decreasing during the next tick.
     * @param sym Symbol of stock
     * @returns Returns the probability that the specified stock’s price will increase (as opposed to decrease) during the next tick.
     */
    getStockForecast(sym: string): number;

    // purchase4SMarketData

    // purchase4SMarketDataTixApi
}
