"use strict";

const http = require("http");

const util = require("@tilliwilli/izida-common/util.js");

const Base = require("@tilliwilli/izida-common/base.js");

class WebServer extends Base
{
    constructor(config, gitProxy, fsProxy){
        if(!gitProxy) throw new Error("Сервису необходима зависимость: gitProxy");
        if(!fsProxy) throw new Error("Сервису необходима зависимость: fsProxy");
        super(config);

        this.fsProxy = fsProxy;
        this.gitProxy = gitProxy;
        
        this._DefaultMiddleware = this._DefaultMiddleware.bind(this);
        this._DefaultListenCallback = this._DefaultListenCallback.bind(this);
        this.StartServer = this.StartServer.bind(this);

        this.server = http.createServer(this._DefaultMiddleware);
    }

    StartServer(callback){
        let self = this;
        const cb = callback || this._DefaultListenCallback;
        return new Promise((RESOLVE, REJECT)=>{
            //Эта ошибка может валиться например при malformed http request
            self.server.on("clientError", (error, socket)=>{
                console.error(error);
                socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
            });

            self.server.listen(this.config.port, error => error?REJECT(error):RESOLVE(cb()));
        });
        
    }

    _ValidateInnerState(){
        super._ValidateInnerState();
        if(!this.config) throw new Error("coreConfig не задан");
        if(!this.config.port) throw new Error(`Не задан порт`);
        if(!this.config.webRoot) throw new Error("Отсутсвует необходимый параметр: coreConfig.webRoot");
    }

    _DefaultMiddleware(request, response){
        let self = this;
        response.setHeader("Content-Type", "application/json");
        switch(request.url.slice(1))
        {
            case "":
                let ctx = {};
                return Promise.resolve()
                    .then(() => self.fsProxy.GetLastSyncCommit())
                        .then(lsc => ctx.lastSyncCommit = lsc)
                    .then(() => self.gitProxy.GetLastestCommitHash())
                        .then(lastest => ctx.lastestCommit = lastest)
                    .then(() => self.fsProxy.RepoBundleStats())
                        .then(stats => ctx.bundle = stats)
                    .then(() => ctx.time = util.Now())
                    .then(() => ctx.status = "ok")
                    .then(() => response.end(JSON.stringify(ctx)))
                    .catch(error => response.end(JSON.stringify(error)));
            case "time":
                return response.end(JSON.stringify(util.Now()));
            case "history":
                return Promise.resolve()
                    .then(() => self.gitProxy.GetGitHistory())
                    .then(history => response.end(JSON.stringify(history)))
                    .catch(error => response.end(JSON.stringify(error)))
            case "downloadBundle":
                return self.fsProxy.GetBundleStream().pipe(response);
            case "setLastCommit":
                if(request.method === "POST")
                    return self._BodyParse(request)
                        .then(json => self.fsProxy.StoreLastSyncCommit(json))
                        .then(json => response.end(JSON.stringify("ok")))
                        .catch(error => response.end(JSON.stringify(error.message)));
                else
                    return response.end(JSON.stringify("setLastCommit"));
            default:
                return response.end(JSON.stringify(`Нет такой команды: ${request.url.slice(1)}`));
        }
    }

    _DefaultListenCallback(){
        console.log(`Server listen on ${this.config.port} port`);
    }

    _BodyParse(request){
        return new Promise((RESOLVE, REJECT)=>{
            var rawData = "";
            request
                .on("error", error => REJECT(error))
                .on("data", chunk => rawData+=chunk)
                .on("end", () => RESOLVE(JSON.parse(rawData)) );
        });
    }
}

module.exports = WebServer;