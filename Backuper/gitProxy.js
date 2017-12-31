"use strict";

const fs = require("fs");
const cp = require("child_process");

const Base = require("../Common/base.js");

class GitProxy extends Base
{
    get gitAppend(){ return `--git-dir=${this.config.gitDirPath} --work-tree=${this.config.workTreePath}`; }

    _ValidateCoreConfig(config){
        super._ValidateCoreConfig(config)
            ._ValidateStringArg(config.workTreePath)
            ._ValidateStringArg(config.gitDirPath);
    }

    Initialize(){
        let self = this;
        const CheckGitInstallationResolver = function(RESOLVE, REJECT){
            cp.exec(`git --version`, error => error?REJECT(error):RESOLVE());
        };
        const CheckGitDirPathResolver = function(RESOLVE, REJECT){
            fs.exists(self.config.gitDirPath, exists => exists?RESOLVE():REJECT(`gitDirPath не существует`));
        };
        const InitGitRepoResolver = function(RESOLVE, REJECT){
            cp.exec(`git init --separate-git-dir ${self.config.gitDirPath} ${self.config.workTreePath}`, error => error?REJECT(error):RESOLVE());
        };

        return Promise.resolve()
            .then(() => new Promise(CheckGitInstallationResolver))
            .then(() => new Promise(CheckGitDirPathResolver))
            .then(() => new Promise(InitGitRepoResolver));
    }

    HasChanges(){
        let self = this;
        return new Promise((RESOLVE, REJECT)=>{
            cp.exec(`git ${self.gitAppend} status`, (error, stdout) => {
                if(error)
                    return REJECT(error);
                if(stdout.indexOf("nothing to commit, working tree clean") !== -1)
                    return RESOLVE(false);
                else
                    return RESOLVE(true);
            });
        });
    }

    CommitAll(){

    }



}

module.exports = GitProxy;