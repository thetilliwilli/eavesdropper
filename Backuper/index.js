"use strict";

const fs = require("fs");

const cron = require("node-cron");

const Base = require("../Common/base.js");
const util = require("../Common/util.js");
const GitProxy = require("./gitProxy.js");

class Backuper extends Base
{
    constructor(config){
        super(config);

        this.inProgress = false;
        this.gitProxy = new GitProxy({workTreePath: config.observablePath, gitDirPath: `${config.gitRepoPath}`});

        this._BackupJob = this._BackupJob.bind(this);
        this._ActionBackup = this._ActionBackup.bind(this);
        this._ActionBundle = this._ActionBundle.bind(this);
    }

    Initialize(){
        let self = this;
        return super.Initialize()
            .then(() => {
                const CheckObservablePathResolver = function(RESOLVE, REJECT){
                    fs.exists(self.config.observablePath, exists => exists?RESOLVE():REJECT("observablePath не существует"));
                };
                const CheckGitRepoPathResolver = function(RESOLVE, REJECT){
                    fs.exists(self.config.gitRepoPath, exists => exists?RESOLVE():REJECT("gitRepoPath не существует"));
                };
                const CheckBundlePathResolver = function(RESOLVE, REJECT){
                    fs.exists(self.config.gitRepoPath, exists => exists?RESOLVE():REJECT("bundlePath не существует"));
                };
        
                return Promise.resolve()
                    .then(() => self.gitProxy.Initialize())
                    .then(() => new Promise(CheckObservablePathResolver))
                    .then(() => new Promise(CheckGitRepoPathResolver))
                    .then(() => new Promise(CheckBundlePathResolver));
            })
            .then(() => self);
    }

    _ValidateCoreConfig(config){
        super._ValidateCoreConfig(config)
            ._ValidateStringArg(config.observablePath)
            ._ValidateStringArg(config.gitRepoPath)
            ._ValidateStringArg(config.bundlePath)
            ._ValidateStringArg(config.schedule);
    }

    StartServer(){
        cron.schedule(this.config.schedule, this._BackupJob);
    }

    _BackupJob(){
        if(this.inProgress)
            return Promise.resolve();
        return Promise.resolve()
            .then(() => this.inProgress = true)
            .then(() => this._ActionWorkTreeHasAnyChanges())
            .then(hasChanges => {
                if(!hasChanges)
                    return Promise.resolve("Изменений в work tree нету");
                return Promise.resolve()
                    .then(() => this._ActionBackup())
                    .then(() => this._ActionBundle())
                    .then(() => "Произведен бекап и обновлен bundle");
            })
            .then(msg => console.log(`Job done successfully at ${new Date().toISOString()} with message: ${msg}`))
            .then(() => this.inProgress = false)
            .catch(util.LogAndRethrow);
    }

    _ActionWorkTreeHasAnyChanges(){
        return this.gitProxy.HasChanges();
    }

    _ActionBackup(){
        const CommitAllJob = this.gitProxy.CommitAll();
        const CommitLinkingCommit = this.gitProxy.Commit(`LinkCommit:${new Date().toISOString()}`);

        return Promise.resolve();
    }

    _ActionBundle(){}

}

module.exports = Backuper;