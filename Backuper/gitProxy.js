"use strict";

const fs = require("fs");
const cp = require("child_process");
const path = require("path");

const Base = require("../Common/base.js");
const util = require("../Common/util.js");

class GitProxy extends Base
{
    get gitAppend(){ return `--git-dir=${this.config.gitDirPath} --work-tree=${this.config.workTreePath}`; }

    _ValidateCoreConfig(config){
        super._ValidateCoreConfig(config)
            ._ValidateStringArg(config.workTreePath)
            ._ValidateStringArg(config.gitDirPath)
            ._ValidateStringArg(config.bundlePath)
            ;
    }

    Initialize(){
        let self = this;
        return super.Initialize()
            .then(() => {
                const CheckGitInstallationResolver = function(RESOLVE, REJECT){
                    cp.exec(`git --version`, error => error?REJECT(error):RESOLVE());
                };
                const CheckGitDirPathResolver = function(RESOLVE, REJECT){
                    fs.exists(self.config.gitDirPath, exists => exists?RESOLVE():REJECT(`gitDirPath не существует`));
                };
                const InitGitRepoResolver = function(RESOLVE, REJECT){
                    cp.exec(`git init --separate-git-dir ${self.config.gitDirPath} ${self.config.workTreePath}`, error => error?REJECT(error):RESOLVE());
                };
                const CheckBundlePathResolver = function(RESOLVE, REJECT){
                    fs.exists(self.config.bundlePath, exists => exists?RESOLVE():REJECT(`bundlePath не существует`));
                };
        
                return Promise.resolve()
                    .then(() => new Promise(CheckGitInstallationResolver))
                    .then(() => new Promise(CheckGitDirPathResolver))
                    .then(() => new Promise(InitGitRepoResolver))
                    .then(() => new Promise(CheckBundlePathResolver));
            })
            .then(() => self);
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

    ContentCommit(message){
        let self = this;
        return new Promise((RESOLVE, REJECT)=>{
            cp.exec(
                `git ${self.gitAppend} add -A && git ${self.gitAppend} commit -m "${message}"`,
                error => error?REJECT(error):RESOLVE()
            );
        });
    }

    LinkCommit(message){
        let self = this;
        return new Promise((RESOLVE, REJECT)=>{
            cp.exec(
                `git ${self.gitAppend} commit --allow-empty -m "${message}"`,
                error => error?REJECT(error):RESOLVE()
            );
        });
    }

    CreateBundle(name, pBranch){
        const bundleAbsPath = path.join(this.config.bundlePath, (name || "repo")+".bundle");
        const branch = pBranch || "master";
        let self = this;
        let ctx = {};

        const CommitsCountResolver = function(RESOLVE, REJECT){
            cp.exec(`git ${self.gitAppend} rev-list --count ${branch}`, (error, stdout)=>{
                if(error)
                    return REJECT(error);
                const commitCount = parseInt(stdout.trim());
                if(isNaN(commitCount))
                    REJECT(new Error(`rev-list --count вернула: ${stdout.trim()}`));
                ctx.commitCount = commitCount;
                RESOLVE(commitCount);
            });
        };

        const LastSyncCommitResolver = function(RESOLVE, REJECT){
            fs.readFile(self.config.storagePath, (error, data) => {
                if(error)
                    return REJECT(error);
                ctx.lastCommit = data;
                RESOLVE(data);
            });
        };

        const GetCommitRange = function(RESOLVE, REJECT){
            cp.exec(`git ${self.gitAppend}  ${branch}`, (error, stdout)=>{

            });
        };

        const CreateBundleResolver = function(RESOLVE, REJECT){
            cp.exec(
                `git ${self.gitAppend} bundle create ${bundleAbsPath} ${branch}`,
                error => error?REJECT(error):RESOLVE()
            );
        };


        return Promise.resolve()
            .then(() => new Promise(CommitsCountResolver))
            .then(() => new Promise(LastSyncCommitResolver))
            .then(commitCount => {
                if(commitCount >= 3)
                    return new Promise()
                        .then(() => new Promise())
                return true;
            })
            // .then(() => )
            ;
    }
}

module.exports = GitProxy;