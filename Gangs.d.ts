declare type EquipmentType = 'Weapon' | 'Armor' | 'Vehicle' | 'Rootkit' | 'Augmentation';

declare type TaskName = string;

declare interface IMemberInformation {
    name?: string;
    equipment: string[];
    hacking: number;
    hackingEquipMult: number;
    hackingAscensionMult: number;
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
    getEquipmentNames(): string[];
    getEquipmentCost(equipName: string): number;
    getEquipmentType(equipName: string): EquipmentType;
    getMemberNames(): string[];
    getMemberInformation(name: string): IMemberInformation;
    purchaseEquipment(memberName: string, equipName: string): boolean;
    setMemberTask(memberName: string, taskName: TaskName): boolean;
}

declare interface IGame {
    gang: IGang;
}
