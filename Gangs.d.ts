declare type EquipmentType = 'Weapon' | 'Armor' | 'Vehicle' | 'Rootkit' | 'Augmentation';

declare type TaskName = string;

declare interface IMemberInformation {
    name?: string;
    charisma: number;
    charismaEquipMult: number;
    charismaAscensionMult: number;
    equipment: string[];
    hacking: number;
    hackingEquipMult: number;
    hackingAscensionMult: number;
    strength: number;
    strengthEquipMult: number;
    strengthAscensionMult: number;
    task: string;
}

declare interface IAscension {
    respect: number;
    hack: number;
    str: number;
    def: number;
    dex: number;
    agi: number;
    cha: number;
}

declare interface IGang {
    ascendMember(name: string): IAscension;

    /**
     * @returns Boolean indicating whether a member can currently be recruited
     */
    canRecruitMember(): boolean;

    getEquipmentNames(): string[];
    getEquipmentCost(equipName: string): number;
    getEquipmentType(equipName: string): EquipmentType;
    getMemberNames(): string[];
    getMemberInformation(name: string): IMemberInformation;
    purchaseEquipment(memberName: string, equipName: string): boolean;

    /**
     * Attempt to recruit a new gang member.
     * @param name Name of member to recruit
     */
    recruitMember(name: string): boolean;

    setMemberTask(memberName: string, taskName: TaskName): boolean;
}

declare interface IGame {
    gang: IGang;
}
