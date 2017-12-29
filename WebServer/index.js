"use strict";

const http = require("http");

const util = require("../Common/util.js");

const FSProxy = require("./fsProxy.js");


class WebServer
{
    constructor(config){
        this._ValidateCoreConfig(config);
        this._SetInnerState(config);

        this.server = null;
        this.fsProxy = new FSProxy();

        this._DefaultMiddleware = this._DefaultMiddleware.bind(this);
    }

    Initialize(config){
        this._SetInnerState(config);
        this._ValidateInnerState();

        this.server = http.createServer(this._DefaultMiddleware);
        this.server.listen(this.config.port, ()=>{console.log(`Server listen on ${this.config.port} port`)});
    }



    _SetInnerState(config){
        this.config = Object.assign({}, util.DeepCopy(config || {}));
    }

    _ValidateInnerState(){
        if(!this.config) throw new Error("coreConfig не задан");
        if(!this.config.port) throw new Error(`Не задан порт`);
        if(!this.config.webRoot) throw new Error("Отсутсвует необходимый параметр: coreConfig.webRoot");
    }

    _ValidateCoreConfig(coreConfig){}

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
}

module.exports = WebServer;