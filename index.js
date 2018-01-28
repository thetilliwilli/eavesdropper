"use strict";

const config = require("./config.js");

const WebServer = require("./WebServer/index.js");
const Backuper = require("./Backuper/index.js");
const GitProxy = require("./Module/gitProxy.js");
const FSProxy = require("./Module/fsProxy.js");

const webConfig = Object.assign({}, config.webServer, config.fsProxy, config.backuper);
const backupConfig = Object.assign({}, config.fsProxy, config.backuper);
const gitConfig = Object.assign({}, {
    workTreePath: config.fsProxy.observablePath,
    gitDirPath: config.fsProxy.gitRepoPath,
    bundlePath: config.fsProxy.bundlePath,
    storagePath: config.fsProxy.storagePath,
    rootCommit: config.backuper.rootCommit,
    restoreDefaultRepoCommit: config.backuper.restoreDefaultRepoCommit,
});
const fsConfig = webConfig;

const gitProxy = new GitProxy(gitConfig);
const fsProxy = new FSProxy(fsConfig);
const webServer = new WebServer(webConfig, gitProxy);
const backuper = new Backuper(backupConfig, gitProxy);


Promise.resolve()
    //INITIALIZE SERVICES
    .then(() => gitProxy.Initialize())
    .then(() => fsProxy.Initialize())
    .then(() => webServer.Initialize())
    .then(() => backuper.Initialize())
    //START SERVERS
    .then(() => backuper.StartServer())
    .then(() => webServer.StartServer())
    //CUSTOM ACTIONS (after all stuff has prepared)
    .then(() => {
        console.log(`Инициализация всех сервисов прошла успешно`);// do what u want here
    })
    //ERRORS
    .catch(error => console.error(error));