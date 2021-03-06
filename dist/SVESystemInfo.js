"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SVESystemInfo = void 0;
var SVESystemInfo = /** @class */ (function () {
    function SVESystemInfo() {
        this.systemState = {
            authorizationSystem: false,
            basicSystem: false,
            tokenSystem: false
        };
        this.SQLCredentials = {
            MySQL_DB: "",
            MySQL_Password: "",
            MySQL_User: ""
        };
        this.sources = {
            protocol: "https",
            sveService: undefined,
            persistentDatabase: undefined,
            volatileDatabase: undefined
        };
        SVESystemInfo.isServer = false;
    }
    SVESystemInfo.checkAPI = function (api) {
        return new Promise(function (resolve, reject) {
            fetch(SVESystemInfo.getInstance().sources.protocol + "://" + api + '/check', {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
            }).then(function (response) {
                if (response.status < 400) {
                    response.json().then(function (val) {
                        resolve(val);
                    }, function (err) { return reject(err); });
                }
                else {
                    reject();
                }
            }, function (err) { return reject(err); });
        });
    };
    SVESystemInfo.getIsServer = function () {
        return SVESystemInfo.isServer;
    };
    SVESystemInfo.getInstance = function () {
        if (!SVESystemInfo.instance) {
            SVESystemInfo.instance = new SVESystemInfo();
        }
        return SVESystemInfo.instance;
    };
    SVESystemInfo.initSystem = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.instance.systemState = {
                authorizationSystem: false,
                basicSystem: false,
                tokenSystem: false
            };
            if (_this.getInstance().sources.sveService !== undefined) {
                fetch(_this.getInstance().sources.protocol + "://" + _this.getInstance().sources.sveService + '/check', {
                    method: "GET"
                }).then(function (response) {
                    if (response.status < 400) {
                        response.json().then(function (val) {
                            _this.instance.systemState = val.status;
                            resolve(true);
                        }, function (err) { return reject(false); });
                    }
                    else {
                        reject(false);
                    }
                }, function (err) { return reject(err); });
            }
            else {
                reject(false);
            }
        });
    };
    SVESystemInfo.getSystemStatus = function () {
        return this.getInstance().systemState;
    };
    /*public static getLoggedInUser(): Promise<SVEAccount> {
        return new Promise<SVEAccount>((resolve, reject) => {
            fetch(SVESystemInfo.getAPIRoot() + "/check", {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            }).then((response) => {
                if (response.status < 400) {
                    response.json().then(val => {
                        if ("loggedInAs" in val) {
                            new SVEAccount(val.loggedInAs as SessionUserInitializer, (usr) => {
                                resolve(usr);
                            });
                        } else {
                            console.log("No user logged in Session");
                            reject();
                        }
                    });
                } else {
                    reject();
                }
            }, err => reject());
        });
    }*/
    SVESystemInfo.getFullSystemState = function () {
        return new Promise(function (resolve, reject) {
            fetch(SVESystemInfo.getAPIRoot() + "/check", {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            }).then(function (response) {
                if (response.status < 400) {
                    response.json().then(function (val) {
                        resolve({
                            authorizationSystem: val.status.authorizationSystem,
                            basicSystem: val.status.basicSystem,
                            tokenSystem: val.status.tokenSystem
                        });
                    }, function (err) { return reject({
                        error: "Server response was no valid JSON!",
                        err: err
                    }); });
                }
                else {
                    reject({
                        error: "Server Status: " + response.status
                    });
                }
            }, function (err) {
                reject(err);
            });
        });
    };
    SVESystemInfo.getAPIRoot = function () {
        return (SVESystemInfo.getInstance().sources.sveService !== undefined) ? SVESystemInfo.getInstance().sources.protocol + "://" + SVESystemInfo.getInstance().sources.sveService : "";
    };
    SVESystemInfo.getAccountServiceRoot = function () {
        return (SVESystemInfo.getInstance().sources.accountService !== undefined) ? SVESystemInfo.getInstance().sources.protocol + "://" + SVESystemInfo.getInstance().sources.accountService : "";
    };
    SVESystemInfo.getAuthRoot = function () {
        return (SVESystemInfo.getInstance().sources.authService !== undefined) ? SVESystemInfo.getInstance().sources.protocol + "://" + SVESystemInfo.getInstance().sources.authService : "";
    };
    SVESystemInfo.getGameRoot = function (useWebSocket) {
        if (useWebSocket === void 0) { useWebSocket = false; }
        var prot = SVESystemInfo.getInstance().sources.protocol;
        if (useWebSocket)
            prot = (prot == "http") ? "ws" : "wss";
        return (SVESystemInfo.getInstance().sources.gameService !== undefined) ? prot + "://" + SVESystemInfo.getInstance().sources.gameService : "";
    };
    SVESystemInfo.getAIRoot = function () {
        return (SVESystemInfo.getInstance().sources.aiService !== undefined) ? SVESystemInfo.getInstance().sources.protocol + "://" + SVESystemInfo.getInstance().sources.aiService : "";
    };
    return SVESystemInfo;
}());
exports.SVESystemInfo = SVESystemInfo;
