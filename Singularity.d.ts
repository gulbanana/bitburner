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
    // XXX
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

    // XXX many more
}
