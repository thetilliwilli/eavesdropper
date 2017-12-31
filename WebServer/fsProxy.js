"use strict";

const fs = require("fs");

const Base = require("../Common/base.js");

class FSProxy extends Base
{
    
    GetFileList(){
        return new Promise(
            (RESOLVE, REJECT) => fs.readdir(this.config.bentoPath, (error, files) => error?REJECT(error):RESOLVE(files))
        );
    }

    GetFileStreams(){
        throw new Error("Unimplemented");
    }

    _ValidateCoreConfig(config){
        super._ValidateCoreConfig(config)
            ._ValidateStringArg(config.observablePath)
            ._ValidateStringArg(config.gitRepoPath)
            ._ValidateStringArg(config.bundlePath)
            ._ValidateStringArg(config.bentoPath);
    }
}

module.exports = FSProxy;