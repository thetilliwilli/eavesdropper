"use strict";

const http = require("http");

const util = require("../Common/util.js");

const FSProxy = require("./fsProxy.js");
const Base = require("../Common/base.js");


class WebServer extends Base
{
    constructor(config){
        super(config);

        this.server = null;
        this.fsProxy = null;

        this._DefaultMiddleware = this._DefaultMiddleware.bind(this);
        this._DefaultListenCallback = this._DefaultListenCallback.bind(this);
        this.StartServer = this.StartServer.bind(this);
    }

    Initialize(config){
        super.Initialize(config);

        this.fsProxy = new FSProxy(this.config);
        this.server = http.createServer(this._DefaultMiddleware);
        return this;
    }

    StartServer(callback){
        const cb = callback || this._DefaultListenCallback;
        this.server.listen(this.config.port, cb);
    }


    _ValidateInnerState(){
        super._ValidateInnerState();
        if(!this.config) throw new Error("coreConfig не задан");
        if(!this.config.port) throw new Error(`Не задан порт`);
        if(!this.config.webRoot) throw new Error("Отсутсвует необходимый параметр: coreConfig.webRoot");
    }

    

    _DefaultMiddleware(request, response){
        response.setHeader("Content-Type", "application/json");
        switch(request.url.slice(1))
        {
            case "":
                return this.fsProxy.GetFileList()
                    .then(list=>response.end(JSON.stringify(list)))
                    .catch(error => response.error(error));
            case "download":
                return response.end("download");
            case "time":
                return response.end(util.Now());
            default:
                return response.end(`Нет такой команды: ${request.url.slice(1)}`);
        }
    }

    _DefaultListenCallback(){
        console.log(`Server listen on ${this.config.port} port`);
    }

}

module.exports = WebServer;