declare interface IStats {
    hacking: number;
    strength: number;
    defense: number;
    dexterity: number;
    agility: number;
    charisma: number;
    intelligence: number;
}

declare interface ICharacterInfo {
    bitnode: number;
    city: string;
    factions: string[];
    jobs: string[];
    jobTitle: string[];
    tor: boolean;
    // XXX
}

declare interface IProgram {
    req: number;
    name: string;
    price: number;
    hack?: (ns: IGame) => ((host: string) => void);
}

declare interface IGame {
    universityCourse(universityName: string, courseName: string): boolean;
    gymWorkout(gymName: string, stat: string): boolean;
    travelToCity(cityName: string): boolean;

    /**
     * This function allows you to automatically purchase a TOR router. The cost for purchasing a TOR router using this function is the same as if you were to manually purchase one.
     */
    purchaseTor(): boolean;

    /**
     * This function allows you to automatically purchase programs. You MUST have a TOR router in order to use this function. The cost of purchasing programs using this function is the same as if you were purchasing them through the Dark Web using the Terminal buy command.
     * @param programName Name of program to purchase. Must include ‘.exe’ extension. Not case-sensitive.
     */
    purchaseProgram(programName: string): boolean;

    getStats(): IStats;
    getCharacterInformation(): ICharacterInfo;

    /**
     * Returns a boolean indicating whether or not the player is currently performing an ‘action’. These actions include working for a company/faction, studying at a univeristy, working out at a gym, creating a program, or committing a crime.
     */
    isBusy(): boolean;

    /**
     * This function is used to end whatever ‘action’ the player is currently performing. The player will receive whatever money/experience/etc. he has earned from that action.
     */
    stopAction(): boolean;

    /*************************/
    /* Source-File 4 Level 2 */
    /*************************/
    upgradeHomeRam(): boolean;
    getUpgradeHomeRamCost(): number;
    workForCompany(): boolean;
    applyToCompany(companyName: string, field: string): boolean;
    getCompanyRep(companyName: string): number;
    getCompanyFavor(companyName: string): number;
    getCompanyFavorGain(companyName: string): number;
    checkFactionInvitations(): string[];
    joinFaction(name: string);
    getFactionRep(companyName: string): number;
    getFactionFavor(companyName: string): number;
    getFactionFavorGain(companyName: string): number;
    donateToFaction(factionName: string, donateAmt: number): boolean;

    /**
     * This function will automatically set you to start working on creating the specified program. If you are already in the middle of some “working” action (such as working for a company, training at a gym, or taking a course), then running this function will automatically cancel that action and give you your earnings.
     * @param programName Name of program to create. Not case-sensitive
     */
    createProgram(programName: string): boolean;

    // XXX more
}
