"use strict";

const fs = require("fs");
const cp = require("child_process");
const path = require("path");

const cron = require("node-cron");

const Base = require("@tilliwilli/izida-common/base.js");
const util = require("@tilliwilli/izida-common/util.js");
const GitProxy = require("./gitProxy.js");

class Backuper extends Base
{
    constructor(config){
        super(config);

        this.inProgress = false;
        this.gitProxy = new GitProxy({
            workTreePath: config.observablePath,
            gitDirPath: config.gitRepoPath,
            bundlePath: config.bundlePath,
            storagePath: config.storagePath,
            rootCommit: config.rootCommit,
        });

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
        cron.schedule(this.config.schedule, this._BackupJob);//запуск по расписанию
        this._BackupJob();//запуск сразу
    }

    _BackupJob(){
        let self = this;
        if(this.inProgress)
            return Promise.resolve();
        return Promise.resolve()
            .then(() => self.inProgress = true)
            .then(() => self._ActionMongoBackup())
            .then(msg => console.log(`Mongo dump is done at ${util.Now()}`))
            .then(() => self._ActionWorkTreeHasAnyChanges())
            .then(hasChanges => {
                if(!hasChanges)
                    return Promise.resolve("Изменений в work tree нету");
                return Promise.resolve()
                    .then(() => self._ActionBackup())
                    .then(() => self._ActionBundle())
                    .then(() => "Произведен бекап и обновлен bundle");
            })
            .then(msg => console.log(`FS backup is done at ${util.Now()} with message: ${msg}`))
            .then(() => self.inProgress = false)
            .catch(error => {
                self.inProgress = false;
                util.LogAndRethrow(error);
            });
    }

    _ActionWorkTreeHasAnyChanges(){
        return this.gitProxy.HasChanges();
    }

    _ActionBackup(){
        let self = this;
        const now = util.Now();
        return Promise.resolve()
            .then(() => self.gitProxy.LinkCommit(`-`))
            .then(() => self.gitProxy.ContentCommit(`C`))
            .then(() => self.gitProxy.LinkCommit(`+`));
    }
    
    _ActionBundle(){
        let self = this;
        return Promise.resolve()
            .then(() => self.gitProxy.CreateBundle());
    }

    _ActionMongoBackup(){
        let self = this;
        return new Promise((RESOLVE, REJECT) => {
            const absFilePath = path.join(self.config.observablePath, "db.archive");
            cp.exec(`mongodump --db TAG --archive="${absFilePath}"`, error => error ? REJECT(error) : RESOLVE());
        });
    }

}

module.exports = Backuper;