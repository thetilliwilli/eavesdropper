"use strict";

module.exports = {
    Now: () => (new Date()).toISOString(),
    DeepCopy: donor=>JSON.parse(JSON.stringify(donor)),
    LogAndRethrow: error => { console.error(error); throw error; },
};