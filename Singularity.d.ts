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

    mult: ICharacterInfoMultipliers;

    timeWorked: number;
    workHackExpGain: number;
    workStrExpGain: number;
    workDefExpGain: number;
    workDexExpGain: number;
    workAgiExpGain: number;
    workChaExpGain: number;
    workRepGain: number;
    workMoneyGain: number;
}

declare interface ICharacterInfoMultipliers {
    charisma: number;
    charismaExp: number;

    // XXX
}

declare interface IGame {
    universityCourse(universityName: string, courseName: 'Study Computer Science' | 'Data Structures' | 'Networks' | 'Algorithms' | 'Management' | 'Leadership'): boolean;
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
    workForFaction(factionName: string, workType: 'hacking' | 'field' | 'security'): number;
    getFactionRep(companyName: string): number;
    getFactionFavor(companyName: string): number;
    getFactionFavorGain(companyName: string): number;
    donateToFaction(factionName: string, donateAmt: number): boolean;

    /**
     * This function will automatically set you to start working on creating the specified program. If you are already in the middle of some “working” action (such as working for a company, training at a gym, or taking a course), then running this function will automatically cancel that action and give you your earnings.
     * @param programName Name of program to create. Not case-sensitive
     */
    createProgram(programName: string): boolean;

    commitCrime(crime: string): number;
    
    /**
     * This function returns your chance of success at commiting the specified crime. The chance is returned as a decimal (i.e. 60% would be returned as 0.6).
     * @param crime Name of crime. Not case-sensitive. This argument is fairlyn lenient in terms of what inputs it accepts. Check the documentation for the commitCrime() function for a list of example inputs.
     */
    getCrimeChance(crime: string): number;
    
    getOwnedAugmentations(purchased?: boolean): string[]

    /**
     * Returns an array containing the names (as strings) of all Augmentations that are available from the specified faction.
     * @param facName Name of faction. CASE-SENSITIVE
     */
    getAugmentationsFromFaction(facName: string): string[];
    
    /**
     * This function returns an array with the names of the prerequisite Augmentation(s) for the specified Augmentation. If there are no prerequisites, a blank array is returned.
     * @param augName Name of Augmentation. CASE-SENSITIVE
     */
    getAugmentationPrereq(augName: string): string[]

    /**
     * This function returns an array with two elements that gives the cost for the specified Augmentation. The first element in the returned array is the reputation requirement of the Augmentation, and the second element is the money cost.
     * @param augName Name of Augmentation. CASE-SENSITIVE
     */
    getAugmentationCost(augName: string): [number, number];

    // XXX more
}
