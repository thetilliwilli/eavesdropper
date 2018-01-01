"use strict";

const http = require("http");

const util = require("@tilliwilli/izida-common/util.js");

const FSProxy = require("./fsProxy.js");
const Base = require("@tilliwilli/izida-common/base.js");


class WebServer extends Base
{
    constructor(config){
        super(config);

        this.fsProxy = null;
        
        this._DefaultMiddleware = this._DefaultMiddleware.bind(this);
        this._DefaultListenCallback = this._DefaultListenCallback.bind(this);
        this.StartServer = this.StartServer.bind(this);

        this.server = http.createServer(this._DefaultMiddleware);
    }

    Initialize(){
        let self = this;
        return super.Initialize()
            .then(() => self.fsProxy = new FSProxy(self.config))
            .then(() => self);
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
                return self.fsProxy.GetFileList()
                    .then(list=>response.end(JSON.stringify(list)))
                    .catch(error => response.end(JSON.stringify(error.message)));
            case "downloadArchive":
                return self.fsProxy.ArchiveFileStream().pipe(response);
            case "time":
                return response.end(JSON.stringify(util.Now()));
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