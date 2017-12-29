"use strict";

const config = require("./config.js");

const WebServer = require("./WebServer/index.js");

Promise.resolve()
    .then(() => new WebServer().Initialize(config.webServer))
    .then(() => {
        ;// do what u whant here
    })
    .catch(error => console.error(error));