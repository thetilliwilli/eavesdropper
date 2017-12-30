"use strict";

const path = require("path");

module.exports = {
    webServer:{
        port: process.env["webServerPort"] || 10000,
        webRoot: process.env["webRoot"],
    },
    fsProxy:{
        observablePath: process.env["observablePath"],
        gitRepoPath: process.env["gitRepoPath"] || path.join(__dirname, "Storage", "Git"),
        bundlePath: process.env["bundlePath"] || path.join(__dirname, "Storage", "Bundle"),
        bentoPath: process.env["bentoPath"] || path.join(__dirname, "Storage", "Bento"),
    },
    backuper:{
        schedule: "0 0 * * *",
    }
};