"use strict";

const fs = require("fs");

class FSProxy
{
    constructor(config){
        this._ValidateStringArg(config.observablePath)
            ._ValidateStringArg(config.gitRepoPath)
            ._ValidateStringArg(config.bundlePath)
            ._ValidateStringArg(config.bentoPath);
        
        this.config = config;
    }

    GetFileList(){
        return new Promise(
            (RESOLVE, REJECT) => fs.readdir(this.config.bentoPath, (error, files) => error?REJECT(error):RESOLVE(files))
        );
    }

    GetFileStreams(){
        throw new Error("Unimplemented");
    }

    _ValidateStringArg(arg){
        if(!arg || typeof(arg) !== "string")
            throw new Error("Неверный формат аргумента");
        return this;
    }
}

module.exports = FSProxy;