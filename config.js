"use strict";

const path = require("path");

module.exports = {
    webServer:{
        port: process.env["webServerPort"] || 10000,
        webRoot: process.env["webRoot"],
    },
    fsProxy:{
        observablePath: process.env["observablePath"],
        storagePath: path.join(__dirname, "Storage"),
        gitRepoPath: process.env["gitRepoPath"] || path.join(__dirname, "Storage", "Git"),
        bundlePath: process.env["bundlePath"] || path.join(__dirname, "Storage", "Bundle"),
        bentoPath: process.env["bentoPath"] || path.join(__dirname, "Storage", "Bento"),
    },
    backuper:{
        rootCommit: "b9bba57d9c33a60bcfb3d5e8359007c1947a1600",
        schedule: "59 0 * * *",//в час ночи каждый день
    }
};