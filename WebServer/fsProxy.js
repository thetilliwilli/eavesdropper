"use strict";

const fs = require("fs");

class FSProxy
{
    constructor(config){}

    GetFileList(){
        return Promise.resolve(["Repo.zip.001", "Repo.zip.002", "Repo.zip.003", "Repo.zip.004",]);
    }

    GetFileStreams(){
        throw new Error("Unimplemented");
    }
}

module.exports = FSProxy;