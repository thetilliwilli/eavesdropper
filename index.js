"use strict";

const config = require("./config.js");

const WebServer = require("./WebServer/index.js");
const Backuper = require("./Backuper/index.js");

const webConfig = Object.assign({}, config.webServer, config.fsProxy);
const backupConfig = Object.assign({}, config.fsProxy, config.backuper);

Promise.resolve()
    .then(() => new Backuper(backupConfig).Initialize()).then(backuper => backuper.StartServer())
    .then(() => new WebServer().Initialize(webConfig).StartServer())
    .then(() => {
        console.log(`Инициализация всех сервисов прошла успешно`);// do what u want here
    })
    .catch(error => console.error(error));