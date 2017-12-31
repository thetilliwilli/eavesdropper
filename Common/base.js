"use strict";

const util = require("../Common/util.js");

module.exports = class Base
{
    constructor(config){
        this._ValidateCoreConfig(config);
        this._SetInnerState(config);
    }

    Initialize(config){
        this._SetInnerState(config);
        this._ValidateInnerState();
    }

    _SetInnerState(config){
        this.config = Object.assign({}, util.DeepCopy(config || {}));
    }

    _ValidateCoreConfig(coreConfig){
        if(coreConfig)
            if(typeof(coreConfig) !== "object")
                throw new Error("Неверный core config");
        return this;
    }

    _ValidateInnerState(){ ; /* left blank intentionally */}

    ClassName(){
        return this.constructor.name;
    }
    SuperClass(){
        return this.constructor.__proto__;
    }
    _ThrowNotImplemented(pMethodName = ""){
        throw `[Class]:${this.constructor.name} doesn't implement ${pMethodName?"[Method]:"+pMethodName:"method"}`;
    }

    _ValidateStringArg(arg){
        if(!arg || typeof(arg) !== "string")
            throw new Error("Неверный формат аргумента");
        return this;
    }

}
