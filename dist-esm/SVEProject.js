import { SVEAccount } from './SVEAccount';
import { SVEGroup } from './SVEGroup';
import { SVESystemInfo } from './SVESystemInfo';
import { SVEData, SVEDataType, SVEDataVersion } from './SVEData';
export var SVEProjectType;
(function (SVEProjectType) {
    SVEProjectType[SVEProjectType["Vacation"] = 0] = "Vacation";
    SVEProjectType[SVEProjectType["Sales"] = 1] = "Sales";
    SVEProjectType[SVEProjectType["Documents"] = 2] = "Documents";
})(SVEProjectType || (SVEProjectType = {}));
export var SVEProjectState;
(function (SVEProjectState) {
    SVEProjectState[SVEProjectState["Open"] = 0] = "Open";
    SVEProjectState[SVEProjectState["Closed"] = 1] = "Closed";
})(SVEProjectState || (SVEProjectState = {}));
export function isProjectInitializer(init) {
    return typeof init !== "number";
}
var SVEProject = /** @class */ (function () {
    function SVEProject(idx, handler, onReady) {
        var _this = this;
        this.id = NaN;
        this.name = "";
        this.splashImgID = 0;
        this.type = SVEProjectType.Vacation;
        this.state = SVEProjectState.Open;
        // if get by id
        this.handler = handler;
        if (!isProjectInitializer(idx)) {
            if (SVESystemInfo.getIsServer()) {
                if (onReady !== undefined)
                    onReady(this);
            }
            else {
                fetch(SVESystemInfo.getAPIRoot() + '/project/' + idx + "?sessionID=" + encodeURI(this.handler.getSessionID()), {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    }
                }).then(function (response) {
                    if (response.status < 400) {
                        response.json().then(function (val) {
                            _this.id = Number(val.id);
                            _this.name = val.name;
                            _this.type = val.type;
                            _this.handler = handler;
                            _this.result = ("result" in val) ? Number(val.result) : undefined;
                            _this.splashImgID = "splashImg" in val ? Number(val.splashImg) : 0;
                            _this.dateRange = ("dateRange" in val) ? {
                                begin: new Date(val.dateRange.begin),
                                end: new Date(val.dateRange.end)
                            } : undefined;
                            _this.state = val.state;
                            _this.owner = new SVEAccount({ id: val.owner, requester: _this.handler }, function (s) {
                                _this.group = new SVEGroup({ id: val.group }, handler, function (self) {
                                    if (onReady !== undefined)
                                        onReady(_this);
                                });
                            });
                        });
                    }
                    else {
                        if (onReady !== undefined)
                            onReady(_this);
                    }
                }, function (err) { if (onReady !== undefined)
                    onReady(_this); });
            }
        }
        else {
            this.id = idx.id;
            this.group = idx.group;
            this.name = idx.name;
            this.type = idx.type;
            this.handler = handler;
            this.owner = idx.owner;
            this.splashImgID = (idx.splashImg !== undefined) ? idx.splashImg : 0;
            this.dateRange = idx.dateRange;
            this.result = idx.result;
            if (onReady !== undefined)
                onReady(this);
        }
    }
    SVEProject.prototype.getID = function () {
        return this.id;
    };
    SVEProject.prototype.getState = function () {
        return this.state;
    };
    SVEProject.prototype.setState = function (state) {
        this.state = state;
    };
    SVEProject.prototype.setResult = function (res) {
        if (res === undefined || typeof res === "number") {
            this.result = res;
        }
        else {
            this.result = res.getID();
        }
    };
    SVEProject.prototype.getResult = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            if (_this.result === undefined) {
                reject();
            }
            else {
                new SVEData(_this.handler, _this.result, function (data) {
                    resolve(data);
                });
            }
        });
    };
    SVEProject.prototype.getSplashImgID = function () {
        return this.splashImgID;
    };
    SVEProject.prototype.getDateRange = function () {
        return this.dateRange;
    };
    SVEProject.prototype.getSplashImageURI = function () {
        return new SVEData(this.handler, { id: this.splashImgID, type: SVEDataType.Image, name: "Splash", owner: this.handler, parentProject: this }).getURI(SVEDataVersion.Preview, false);
    };
    SVEProject.prototype.getName = function () {
        return this.name;
    };
    SVEProject.prototype.setName = function (name) {
        this.name = name;
    };
    SVEProject.prototype.setType = function (newType) {
        this.type = newType;
    };
    SVEProject.prototype.setDateRange = function (range) {
        this.dateRange = range;
    };
    SVEProject.prototype.getType = function () {
        return this.type;
    };
    SVEProject.prototype.getOwner = function () {
        var _this = this;
        if (typeof this.owner === "number") {
            return new Promise(function (resolve, reject) {
                _this.owner = new SVEAccount({ id: _this.owner, requester: _this.handler }, function (s) {
                    resolve(_this.owner);
                });
            });
        }
        else {
            return new Promise(function (resolve, reject) {
                if (_this.owner == undefined) {
                    reject();
                }
                else {
                    resolve(_this.owner);
                }
            });
        }
    };
    SVEProject.prototype.setSplashImgID = function (id) {
        this.splashImgID = id;
    };
    // store on server
    SVEProject.prototype.store = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            fetch(SVESystemInfo.getAPIRoot() + '/project/' + ((!isNaN(_this.id)) ? _this.id : "new") + "?sessionID=" + encodeURI(_this.handler.getSessionID()), {
                method: 'PUT',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(_this.getAsInitializer())
            }).then(function (response) {
                if (response.status < 400) {
                    response.json().then(function (val) {
                        _this.id = val.id;
                        _this.name = val.name;
                        _this.type = val.type;
                        _this.result = val.result;
                        _this.splashImgID = "splashImg" in val ? Number(val.splashImg) : 0;
                        _this.dateRange = ("dateRange" in val) ? {
                            begin: new Date(val.dateRange.begin),
                            end: new Date(val.dateRange.end)
                        } : undefined;
                        _this.state = val.state;
                        _this.owner = new SVEAccount({ id: val.owner.id, requester: _this.handler }, function (s) {
                            _this.group = new SVEGroup({ id: val.group.id }, _this.handler, function (self) {
                                resolve(true);
                            });
                        });
                    });
                }
                else {
                    resolve(false);
                }
            });
        });
    };
    // remove from server
    SVEProject.prototype.remove = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            fetch(SVESystemInfo.getAPIRoot() + '/project/' + _this.id + "?sessionID=" + encodeURI(_this.handler.getSessionID()), {
                method: 'DELETE',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            }).then(function (response) {
                resolve(response.status == 200 || response.status == 204);
            });
        });
    };
    SVEProject.prototype.getAsInitializer = function () {
        return {
            id: this.id,
            group: this.group,
            name: this.name,
            owner: this.owner,
            state: this.state,
            type: this.type,
            splashImg: this.splashImgID,
            dateRange: this.dateRange,
            result: this.result
        };
    };
    SVEProject.prototype.getGroup = function () {
        return this.group;
    };
    SVEProject.prototype.getData = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            fetch(SVESystemInfo.getAPIRoot() + '/project/' + _this.id + '/data?sessionID=' + encodeURI(_this.handler.getSessionID()), {
                method: "GET",
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            }).then(function (response) {
                if (response.status < 400) {
                    response.json().then(function (val) {
                        var r = [];
                        var i = 0;
                        if (val.length > 0) {
                            val.forEach(function (v) {
                                r.push(new SVEData(_this.handler, {
                                    id: v.id,
                                    parentProject: _this,
                                    type: v.type,
                                    owner: v.owner,
                                    name: v.name
                                }, function (s) {
                                    i++;
                                    if (i >= val.length) {
                                        resolve(r);
                                    }
                                }));
                            });
                        }
                        else {
                            resolve(r);
                        }
                    }, function (err) { return reject(false); });
                }
                else {
                    reject(false);
                }
            }, function (err) { return reject(err); });
        });
    };
    return SVEProject;
}());
export { SVEProject };
