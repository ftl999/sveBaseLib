import {BasicUserInitializer, LoginState, SVEAccount} from './SVEAccount';
import {SVEGroup} from './SVEGroup';
import {SVESystemInfo} from './SVESystemInfo';
import { SVEData, SVEDataInitializer, SVEDataType, SVEDataVersion } from './SVEData';

export enum SVEProjectType {
    Vacation,
    Sales,
    Documents
}

export enum SVEProjectState {
    Open,
    Closed
}

export interface ProjectInitializer {
    id: number,
    name: string,
    group: SVEGroup,
    splashImg?: number,
    owner: SVEAccount | number,
    state: SVEProjectState,
    result?: number,
    type: SVEProjectType,
    dateRange?: DateRange
}

export interface DateRange {
    begin: Date,
    end: Date
}

export function isProjectInitializer(init: number | ProjectInitializer): boolean {
    return typeof init !== "number";
}

export class SVEProject {
    protected id: number = NaN;
    protected name: string = "";
    protected group?: SVEGroup;
    protected owner?: SVEAccount | number;
    protected handler: SVEAccount;
    protected splashImgID: number = 0;
    protected type: SVEProjectType = SVEProjectType.Vacation;
    protected dateRange?: DateRange;
    protected result?: number;
    protected state: SVEProjectState = SVEProjectState.Open;

    public getID(): number {
        return this.id;
    }

    public getState(): SVEProjectState {
        return this.state;
    }

    public setState(state: SVEProjectState) {
        this.state = state;
    }

    public setResult(res?: number | SVEData) {
        if(res === undefined || typeof res === "number") {
            this.result = res;
        } else {
            this.result = res.getID();
        }
    }

    public getResult(): Promise<SVEData> {
        return new Promise<SVEData>((resolve, reject) => {
            if (this.result === undefined) {
                reject();
            } else {
                new SVEData(this.handler, this.result!, (data: SVEData) => {
                    resolve(data);
                });
            }
        });
    }

    public getSplashImgID(): number {
        return this.splashImgID;
    }

    public getDateRange(): DateRange | undefined {
        return this.dateRange;
    }

    public getSplashImageURI(): string {
        return new SVEData(this.handler, { id: this.splashImgID, type: SVEDataType.Image, name: "Splash", owner: this.handler, parentProject: this } as SVEDataInitializer).getURI(SVEDataVersion.Preview, false);
    }

    public getName(): string {
        return this.name;
    }

    public setName(name: string) {
        this.name = name;
    }

    public setType(newType: SVEProjectType) {
        this.type = newType;
    }

    public setDateRange(range: DateRange) {
        this.dateRange = range;
    }

    public getType(): SVEProjectType {
        return this.type;
    }

    public getOwner(): Promise<SVEAccount> {
        if (typeof this.owner! === "number") {
            return new Promise<SVEAccount>((resolve, reject) => {
                this.owner = new SVEAccount({id: this.owner! as number, requester: this.handler} as BasicUserInitializer, (s) => { 
                    resolve(this.owner! as SVEAccount);
                });
            });
        } else {
            return new Promise<SVEAccount>((resolve, reject) => {
                if (this.owner == undefined) {
                    reject();
                } else {
                    resolve(this.owner! as SVEAccount);
                }
            })
        }
    }

    public setSplashImgID(id: number) {
        this.splashImgID = id;
    }

    // store on server
    public store(): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            fetch(SVESystemInfo.getAPIRoot() + '/project/' + ((!isNaN(this.id)) ? this.id : "new") + "?sessionID=" + encodeURI(this.handler.getSessionID()), {
                method: 'PUT',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json' 
                },
                body: JSON.stringify(this.getAsInitializer())
            }).then(response => {
                if(response.status < 400) {
                    response.json().then(val => {
                        this.id = val.id;
                        this.name = val.name;
                        this.type = val.type;
                        this.result = val.result;
                        this.splashImgID = "splashImg" in val ? Number(val.splashImg) : 0;
                        this.dateRange = ("dateRange" in val) ? {
                            begin: new Date(val.dateRange.begin),
                            end : new Date(val.dateRange.end)
                        } : undefined;
                        this.state = val.state as SVEProjectState;
                        this.owner = new SVEAccount({id: val.owner.id, requester: this.handler} as BasicUserInitializer, (s) => {
                            this.group = new SVEGroup({id: val.group.id}, this.handler, (self) => {
                                resolve(true);
                            });
                        });
                    });
                } else {
                    resolve(false);
                }
            });
        });
    }

    // remove from server
    public remove(): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            fetch(SVESystemInfo.getAPIRoot() + '/project/' + this.id + "?sessionID=" + encodeURI(this.handler.getSessionID()), {
                method: 'DELETE',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json' 
                }
            }).then(response => {
                resolve(response.status == 200 || response.status == 204);
            });
        });
    }

    public constructor(idx: number | ProjectInitializer, handler: SVEAccount, onReady?: (self: SVEProject) => void) {
        // if get by id
        this.handler = handler;
        if (!isProjectInitializer(idx)) {
            if (SVESystemInfo.getIsServer()) {
                if (onReady !== undefined)
                    onReady!(this);
            } else {
                fetch(SVESystemInfo.getAPIRoot() + '/project/' + idx + "?sessionID=" + encodeURI(this.handler.getSessionID()), {
                        method: 'GET',
                        headers: {
                            'Accept': 'application/json',
                            'Content-Type': 'application/json' 
                        }
                }).then(response => {
                    if (response.status < 400) {
                        response.json().then((val) => {
                            this.id = Number(val.id);
                            this.name = val.name;
                            this.type = val.type as SVEProjectType;
                            this.handler = handler;
                            this.result = ("result" in val) ? Number(val.result) : undefined;
                            this.splashImgID = "splashImg" in val ? Number(val.splashImg) : 0;
                            this.dateRange = ("dateRange" in val) ? {
                                begin: new Date(val.dateRange.begin),
                                end : new Date(val.dateRange.end)
                            } : undefined;
                            this.state = val.state as SVEProjectState;
                            this.owner = new SVEAccount({id: val.owner, requester: this.handler} as BasicUserInitializer, (s) => {
                                this.group = new SVEGroup({id: val.group}, handler, (self) => {
                                    if (onReady !== undefined)
                                        onReady!(this);
                                });
                            });
                        });
                    } else {
                        if (onReady !== undefined)
                            onReady!(this);
                    }
                }, err => {if (onReady !== undefined) onReady!(this)});
            }
        } else {
            this.id = (idx as ProjectInitializer).id;
            this.group = (idx as ProjectInitializer).group;
            this.name = (idx as ProjectInitializer).name;
            this.type = (idx as ProjectInitializer).type;
            this.handler = handler;
            this.owner = (idx as ProjectInitializer).owner;
            this.splashImgID = ((idx as ProjectInitializer).splashImg !== undefined) ? (idx as ProjectInitializer).splashImg! : 0;
            this.dateRange = (idx as ProjectInitializer).dateRange;
            this.result = (idx as ProjectInitializer).result;

            if (onReady !== undefined)
                onReady!(this);
        }
    }

    public getAsInitializer(): ProjectInitializer {
        return {
            id: this.id,
            group: this.group!,
            name: this.name,
            owner: this.owner!,
            state: this.state,
            type: this.type,
            splashImg: this.splashImgID,
            dateRange: this.dateRange,
            result: this.result
        };
    }

    public getGroup(): SVEGroup {
        return this.group!;
    }

    public getData(): Promise<SVEData[]> {
        return new Promise<SVEData[]>((resolve, reject) => {
            fetch(SVESystemInfo.getAPIRoot() + '/project/' + this.id + '/data?sessionID=' + encodeURI(this.handler.getSessionID()),
                {
                    method: "GET",
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json' 
                    }
            }).then(response => {
                if (response.status < 400) {
                    response.json().then(val => {
                        let r: SVEData[] = [];
                        let i = 0;
                        if (val.length > 0) {
                            val.forEach((v: any) => {
                                r.push(new SVEData(this.handler, {
                                        id: v.id as number, 
                                        parentProject: this, 
                                        type: v.type as SVEDataType, 
                                        owner: v.owner,
                                        name: v.name
                                     }, (s) => {
                                    i++;
                                    if (i >= val.length) {
                                        resolve(r);
                                    }
                                }));
                            });
                        } else {
                            resolve(r);
                        }
                    }, err => reject(false));
                } else {
                    reject(false);
                }
            }, err => reject(err));
        });
    }
}