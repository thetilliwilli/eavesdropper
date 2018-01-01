"use strict";

const fs = require("fs");
const path = require("path");

const Base = require("../Common/base.js");

class FSProxy extends Base
{
    
    GetFileList(){
        let self = this;
        return new Promise(
            (RESOLVE, REJECT) => fs.readdir(self.config.bentoPath, (error, files) => error?REJECT(error):RESOLVE(files))
        );
    }

    GetFileStreams(){
        throw new Error("Unimplemented");
    }

    StoreLastSyncCommit(commitHash){
        let self = this;
        const absFilePath = path.join(self.config.storagePath, "lastCommit.txt");
        return new Promise((RESOLVE, REJECT)=>{
            fs.writeFile(absFilePath, commitHash, "utf8", error => error ? REJECT(error) : RESOLVE(0))
        });
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