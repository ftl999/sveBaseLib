import { SVEAccount } from './SVEAccount';
import { SVEGroup } from './SVEGroup';
import { SVEData } from './SVEData';
export declare enum SVEProjectType {
    Vacation = 0,
    Sales = 1
}
export interface ProjectInitializer {
    id: number;
    name: string;
    group: SVEGroup;
    splashImg: string;
    owner: SVEAccount | number;
    state: string;
    resultsURI: string;
    type: SVEProjectType;
}
export declare function isProjectInitializer(init: number | ProjectInitializer): boolean;
export declare class SVEProject {
    protected id: number;
    protected name: string;
    protected group?: SVEGroup;
    protected owner?: SVEAccount | number;
    protected handler?: SVEAccount;
    protected splashImgID: number;
    protected type: SVEProjectType;
    getID(): number;
    getSplashImageURI(): string;
    getName(): string;
    getType(): SVEProjectType;
    getOwner(): Promise<SVEAccount>;
    constructor(idx: number | ProjectInitializer, handler: SVEAccount, onReady?: (self: SVEProject) => void);
    getGroup(): SVEGroup;
    getData(): Promise<SVEData[]>;
}
//# sourceMappingURL=SVEProject.d.ts.map