"use strict";

const fs = require("fs");
const path = require("path");

const Base = require("@tilliwilli/izida-common/base.js");

class FSProxy extends Base
{
    
    GetFileList(){
        let self = this;
        return new Promise(
            (RESOLVE, REJECT) => fs.readdir(self.config.bentoPath, (error, files) => error?REJECT(error):RESOLVE(files))
        );
    }

    GetBundleStream(){
        const absFilePath = path.join(this.config.bundlePath, "repo.bundle");
        return fs.createReadStream(absFilePath);
    }

    StoreLastSyncCommit(commitHash){
        let self = this;
        const absFilePath = path.join(self.config.observablePath, "lastSyncCommit.txt");
        return new Promise((RESOLVE, REJECT)=>{
            fs.writeFile(absFilePath, commitHash, "utf8", error => error ? REJECT(error) : RESOLVE(0));
        });
    }

    GetLastSyncCommit(){
        let self = this;
        const absFilePath = path.join(self.config.observablePath, "lastSyncCommit.txt");
        return new Promise((RESOLVE, REJECT)=>{
            fs.readFile(absFilePath, (error, data) => error ? REJECT(error) : RESOLVE(data.toString()));
        });
    }

    _ValidateCoreConfig(config){
        super._ValidateCoreConfig(config)
            ._ValidateStringArg(config.observablePath)
            ._ValidateStringArg(config.gitRepoPath)
            ._ValidateStringArg(config.bundlePath)
            ._ValidateStringArg(config.bentoPath);
    }

    RepoBundleStats(){
        let self = this;

        function PropMapper(obj){
            let {size, atime, mtime, ctime, birthtime} = obj;
            return {size, atime, mtime, ctime, birthtime};
        };

        return new Promise((RESOLVE, REJECT) => {
            const bundleFile = `${self.config.bundlePath}/repo.bundle`;
            fs.stat(bundleFile, (error, stats)=>{
                if(error) return REJECT(error);
                else return RESOLVE(PropMapper(stats));
            });
        });
    }
}

module.exports = FSProxy;