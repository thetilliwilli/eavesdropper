"use strict";
module.exports = {
    webServer:{
        port: process.env["webServerPort"] || 10000,
        webRoot: process.env["webRoot"],
    },
};