"use strict";

const fs = require("fs");
const cp = require("child_process");
const path = require("path");

const Base = require("@tilliwilli/izida-common/base.js");
const util = require("@tilliwilli/izida-common/util.js");

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
                const InitStorageGitRepo = function(RESOLVE, REJECT){
                    const headFile = path.join(self.config.gitDirPath, `HEAD`);
                    const cmd = `git checkout ${self.config.restoreDefaultRepoCommit} -- Storage/Git/*`;
                    fs.exists(headFile, exists => {
                        if(exists) return RESOLVE();
                        else return cp.exec(cmd, error=>error?REJECT(error):RESOLVE());
                    });
                };

                const CheckGitInstallationResolver = function(RESOLVE, REJECT){
                    cp.exec(`git --version`, error => error?REJECT(error):RESOLVE());
                };
                const CheckGitDirPathResolver = function(RESOLVE, REJECT){
                    fs.exists(self.config.gitDirPath, exists => {
                        if(exists) return RESOLVE();
                        else return fs.mkdir(self.config.gitDirPath, error => error?REJECT(error):RESOLVE());
                    });
                };
                const CreateLCSFileIfDoesntExistResolver = function(RESOLVE, REJECT){
                    const lscFile = `${self.config.workTreePath}/lastSyncCommit.txt`;
                    fs.exists(lscFile, exists => {
                        if(exists) return RESOLVE();
                        else return fs.writeFile(lscFile, self.config.rootCommit, error=>error?REJECT(error):RESOLVE());
                    });
                };
                const DeleteGitLinkFileResolver = function(RESOLVE, REJECT){
                    const gitLinkFile = `${self.config.workTreePath}/.git`;
                    fs.exists(gitLinkFile, exists => {
                        if(exists) return fs.unlink(gitLinkFile, error => error?REJECT(error):RESOLVE());
                        else return RESOLVE();
                    });
                };
                const DeleteRepoBundleLockResolver = function(RESOLVE, REJECT){
                    const lockFile = `${self.config.bundlePath}/repo.bundle.lock`;
                    fs.exists(lockFile, exists => {
                        if(exists) return fs.unlink(lockFile, error => error?REJECT(error):RESOLVE());
                        else return RESOLVE();
                    });
                };
                const InitGitRepoResolver = function(RESOLVE, REJECT){
                    cp.exec(`git init --separate-git-dir ${self.config.gitDirPath} ${self.config.workTreePath}`, error => error?REJECT(error):RESOLVE());
                };
                const CheckBundlePathResolver = function(RESOLVE, REJECT){
                    fs.exists(self.config.bundlePath, exists => {
                        if(exists) return RESOLVE();
                        else return fs.mkdir(self.config.bundlePath, error => error?REJECT(error):RESOLVE());
                    });
                };
        
                return Promise.resolve()
                    .then(() => new Promise(InitStorageGitRepo))
                    .then(() => new Promise(CheckGitInstallationResolver))
                    .then(() => new Promise(CheckGitDirPathResolver))
                    .then(() => new Promise(CreateLCSFileIfDoesntExistResolver))
                    .then(() => new Promise(DeleteGitLinkFileResolver))
                    .then(() => new Promise(DeleteRepoBundleLockResolver))
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

        const HasAnyCommitResolver = function(RESOLVE, REJECT){
            cp.exec(`git ${self.gitAppend} branch`, (error, stdout)=>{
                if(error)
                    return REJECT(error);
                if(stdout.trim() === "")
                    return REJECT("Нету ниодного коммита");
                return RESOLVE(true);
            });
        };

        const FirstCommitResolver = function(RESOLVE, REJECT){
            cp.exec(`git ${self.gitAppend} log --reverse --pretty=format:%H`, (error, stdout)=>{
                if(error)
                    return REJECT(error);
                ctx.firstCommitInHistory = stdout.split("\n")[0].trim();
                return RESOLVE(ctx.firstCommitInHistory);
            });
        };

        const LastSyncCommitResolver = function(RESOLVE, REJECT){
            const filePath = path.join(self.config.workTreePath, "lastSyncCommit.txt");
            fs.readFile(filePath, (error, data) => {
                if(error && error.code !== "ENOENT")
                    return REJECT(error);
                if(error && error.code === "ENOENT")//Если нету файла lastSyncCommit.txt то берем самый первый коммита из репозитория
                    ctx.lastSyncCommit = ctx.firstCommitInHistory;
                else
                    ctx.lastSyncCommit = data.toString();
                return RESOLVE(ctx.lastSyncCommit);
            });
        };

        const GetCommitRange = function(RESOLVE, REJECT){
            cp.exec(`git ${self.gitAppend} log --pretty=format:%H`, (error, stdout)=>{
                if(error)
                    return REJECT(error);
                ctx.commitsList = stdout.split("\n");
                if(ctx.commitsList[ctx.commitsList.length-1].trim()==="")
                    ctx.commitsList.splice(-1);
                if(ctx.commitsList.length < 2)
                    return REJECT(`Количество коммитов не соответсвует минимально необходимому = 2.\
                    Сейчас есть: ${ctx.commitsList.length}.\
                    Необходимо правильно проинициализировать хранилище`);
                var commonCommit = ctx.commitsList.find(com => com.trim() === ctx.lastSyncCommit.trim());
                if(commonCommit === undefined)
                    return REJECT(new Error(`Общий коммит для синхронизации не найден. Попробуйте увеличить диапазон сихронизации или удалите файл lastSyncCommit.txt для полной синхронизации с нуля`));
                ctx.commitRange = `${commonCommit}..${ctx.commitsList[0]}`;
                return RESOLVE(ctx.commitRange);
            });
        };

        const CreateBundleResolver = function(RESOLVE, REJECT){
            const cmd = `git ${self.gitAppend} bundle create ${bundleAbsPath} ${branch} ${ctx.commitRange}`;
            console.log(`[GitCommand.CreateBundle]: ${cmd}`);
            cp.exec(cmd, error => error?REJECT(error):RESOLVE() );
        };


        return Promise.resolve()
            .then(() => new Promise(HasAnyCommitResolver))
            .then(() => new Promise(FirstCommitResolver))
            .then(() => new Promise(LastSyncCommitResolver))
            .then(() => new Promise(GetCommitRange))
            .then(() => new Promise(CreateBundleResolver))
            .catch(util.LogAndRethrow)
            ;
    }

    GetGitHistory(){
        let self = this;
        return new Promise((RESOLVE, REJECT)=>{
            cp.exec(`git ${self.gitAppend} log --reverse --pretty=format:"%H %s %cI"`, (error, stdout)=>{
                if(error)
                    return REJECT(error);
                const result  = stdout.split("\n").map(c => {
                    let [hash, msg, time] = c.split(" ");
                    return {hash, msg, time};
                });
                return RESOLVE(result);
            });
        });
    }

    GetLastestCommitHash(){
        let self = this;
        return new Promise((RESOLVE, REJECT) => {
            const cmd = `git ${self.gitAppend} log --pretty=format:%H`;
            cp.exec(cmd, (error, stdout)=>{
                if(error) return REJECT(error);
                else return RESOLVE(stdout.slice(0, stdout.indexOf("\n")).trim());
            });
        });
    }
}

module.exports = GitProxy;