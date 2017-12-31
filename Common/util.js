"use strict";

module.exports = {
    Now: () => (new Date()).toISOString(),
    NowSafe: () => (new Date()).toISOString().replace(/:/g,"-").replace(".","_"),
    DeepCopy: donor=>JSON.parse(JSON.stringify(donor)),
    LogAndRethrow: error => { console.error(error); throw error; },
};