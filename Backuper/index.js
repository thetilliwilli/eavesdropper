"use strict";

const cron = require("node-cron");

const Base = require("../Common/base.js");
const util = require("../Common/util.js");

class Backuper extends Base
{
    constructor(config){
        super(config);

        this._BackupJob = this._BackupJob.bind(this);
        this._ActionBackup = this._ActionBackup.bind(this);
        this._ActionBundle = this._ActionBundle.bind(this);
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
        return Promise.resolve()
            .then(() => this._ActionBackup)
            .then(() => this._ActionBundle)
            .then(() => console.log(`Job done successfully at ${new Date().toISOString()}`))
            .catch(util.LogAndRethrow);
    }

    _ActionBackup(){}

    _ActionBundle(){}

}

module.exports = Backuper;