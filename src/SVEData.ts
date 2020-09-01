import {BasicUserInitializer, SVEAccount} from './SVEAccount';
import {SVEProject} from './SVEProject';
import {SVEGroup} from './SVEGroup';
import {SVESystemInfo} from './SVESystemInfo';
import { Stream } from 'stream';

export enum SVEDataType {
    Image,
    Video,
    PDF,
    CSV
}

export interface SVEDataInitializer {
    id?: number,
    data?: ArrayBuffer | Stream, 
    path?: SVELocalDataInfo,
    type: SVEDataType,
    parentProject: SVEProject
}

export interface SVELocalDataInfo {
    filePath: string,
    thumbnailPath: string
}

var mimeMap: Map<string, string> = new Map();
mimeMap.set("html", 'text/html');
mimeMap.set("txt", 'text/css');
mimeMap.set("css", 'text/html');
mimeMap.set("gif", 'image/gif');
mimeMap.set("jpg", 'image/jpeg');
mimeMap.set("png", 'image/png');
mimeMap.set("svg", 'image/svg+xml');
mimeMap.set("js", 'application/javascript');
mimeMap.set("mp4", 'video/mp4');
mimeMap.set("pdf", 'application/pdf');

export class SVEData {
    protected type: SVEDataType = SVEDataType.Image;
    protected id: number = -1;
    protected data?: ArrayBuffer | Stream;
    protected parentProject?: SVEProject;
    protected handler: SVEAccount;
    protected owner?: SVEAccount;
    protected localDataInfo?: SVELocalDataInfo;
    protected lastAccess: Date = new Date();
    protected creation: Date = new Date();

    public static getMimeTypeMap(): Map<string, string> {
        return mimeMap;
    }

    public initFromResult(result: any, onComplete: () => void) {
        this.localDataInfo = {
            filePath: result.path,
            thumbnailPath: result.thumbnail
        };

        this.creation = result.creation;
        this.lastAccess = result.lastAccess;

        this.type = SVEData.getTypeFrom(result.type);

        this.owner = new SVEAccount({id: result.user_id} as BasicUserInitializer, (s) => {
            onComplete();
        });
    }

    public static getTypeFrom(str: string): SVEDataType {
        if(str === "Image") {
            return SVEDataType.Image;
        }
        if(str === "Video") {
            return SVEDataType.Video;
        }
        if(str === "PDF") {
            return SVEDataType.PDF;
        }
        if(str === "CSV") {
            return SVEDataType.CSV;
        }
        return SVEDataType.Image;
    }

    // gets the data by index if initInfo is number. Else a new data record is created on server
    public constructor(handler: SVEAccount, initInfo: number | SVEDataInitializer, onComplete: (self: SVEData) => void) {
        this.handler = handler;

        if (typeof initInfo === "number") {
            this.id = initInfo as number;

            if (typeof SVESystemInfo.getInstance().sources.sveService !== undefined) {
                async () => {
                    const response = await fetch(SVESystemInfo.getInstance().sources.sveService + '/data/' + this.id, {
                        method: 'GET',
                        headers: {
                            'Accept': 'application/json',
                            'Content-Type': 'application/json' 
                        }
                    });
                    if (response.status < 400) {
                        response.json().then((val) => {
                            this.id = val.id;
                            this.type = val.type as SVEDataType;
                            this.creation = val.creation;
                            this.lastAccess = val.lastAccess;
                            this.parentProject = new SVEProject(val.project.id, this.handler, (prj) => {
                                onComplete(this);
                            });
                        });
                    } else {
                        this.id = -1;
                        onComplete(this);
                    }
                };
            }
        } else {
            if ((initInfo as SVEDataInitializer).id !== undefined) {
                this.id = (initInfo as SVEDataInitializer).id!;
            }
            this.type = (initInfo as SVEDataInitializer).type;
            this.data = (initInfo as SVEDataInitializer).data;
            if((initInfo as SVEDataInitializer).path !== undefined)
                this.localDataInfo = (initInfo as SVEDataInitializer).path;
            this.parentProject = (initInfo as SVEDataInitializer).parentProject;

            if (typeof SVESystemInfo.getInstance().sources.persistentDatabase !== "string") {
                
            } else {
                
            }

            onComplete(this);
        }
    }

    public getID(): number {
        return this.id;
    }

    public getOwner(): SVEAccount {
        return this.owner!;
    }

    public getCreationDate(): Date {
        return this.creation;
    }

    public getLastAccessDate(): Date {
        return this.lastAccess;
    }

    public getCacheType(): string {
        let r = "private";

        if (this.type === SVEDataType.PDF) {
            r = "no-store";
        }

        return r;
    }

    public getContentType(): string {
        let r = "application/octet-stream";

        if (this.localDataInfo !== undefined) {
            var path = require('path');
            r = mimeMap.get((path.extname(this.localDataInfo.filePath).slice(1) as string).toLowerCase()) as string;
        } else {
            if (this.type === SVEDataType.Image) {
                r = "image/png";
            }
            if (this.type === SVEDataType.Video) {
                r = "video/mp4";
            }
            if (this.type === SVEDataType.PDF) {
                r = "application/pdf";
            }
        }

        return r;
    }

    public getName(): string {
        if (this.localDataInfo === undefined) {
            return "";
        } else {
            var path = require('path');
            return path.basename(this.localDataInfo.filePath);
        }
    }

    public getType(): SVEDataType {
        return this.type;
    }

    public getProject(): SVEProject {
        return this.parentProject!;
    }

    public store(): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            resolve(true);
        });
    }

    public getBLOB(): Promise<ArrayBuffer> {
        return new Promise<ArrayBuffer>((resolve, reject) => {
            if(this.data === undefined) {
                var self = this;
                async () => {
                    const response = await fetch(SVESystemInfo.getInstance().sources.sveService + '/data/' + this.id + "/download", {
                        method: 'GET',
                        headers: {
                            'Accept': '*'
                        }
                    });
                    if (response.status < 400) {
                        response.arrayBuffer().then((val) => {
                            self.data = val;
                            resolve(self.data);
                        });
                    } else {
                        reject(null);
                    }
                };
                return;
            }

            if(this.data !== undefined) {
                resolve(this.data! as ArrayBuffer);
            } else {
                reject(null);
            }
        });
    }

    public getStream(): Promise<Stream> {
        return new Promise<Stream>((resolve, reject) => {
            if(this.data !== undefined) {
                var self = this;
                (this.data! as Stream).on('error', function(err) {
                    reject(null);
                });
                (this.data! as Stream).on('open', function() {
                    resolve(self.data! as Stream);
                });
            } else {
                reject(null);
            }
        });
    }
}