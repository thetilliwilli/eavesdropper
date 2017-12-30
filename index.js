"use strict";

const config = require("./config.js");

const WebServer = require("./WebServer/index.js");

const webConfig = Object.assign({}, config.webServer, config.fsProxy);

Promise.resolve()
    .then(() => new WebServer().Initialize(webConfig))
    .then(() => {
        ;// do what u want here
    })
    .catch(error => console.error(error));