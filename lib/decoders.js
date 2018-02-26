'use strict';
const proto = require("./proto");
const Buffer = require('buffer').Buffer;

let decoders = {
    return: decodeReturn,
    double: decodeDouble,
    float: decodeFloat,
    sInt32: decodeSInt32,
    sInt64: decodeSInt64,
    uInt32: decodeUInt32,
    uInt64: decodeUInt64,
    bool: decodeBool,
    string: decodeString,
    bytes: decodeBytes,
    enum: decodeEnum,
    class: decodeClass,
    dictionary: decodeDictionary,
    list: decodeList,
    set: decodeSet,
    tuple: decodeTuple,

    0: ()=>null,

    // Values
    1: decodeDouble,
    2: decodeFloat,
    3: decodeSInt32,
    4: decodeSInt64,
    5: decodeUInt32,
    6: decodeSInt64,
    7: decodeBool,
    8: decodeString,
    9: decodeBytes,

    // Objects
    100: decodeClass,
    101: decodeEnum,

    // Messages
    200: (value)=>proto.Event.decode(value),
    201: (value)=>proto.ProcedureCall.decode(value),
    202: (value)=>proto.Stream.decode(value),
    203: (value)=>proto.Status.decode(value),
    204: (value)=>proto.Services.decode(value),

    // Collections
    300: decodeTuple,
    301: decodeList,
    302: decodeSet,
    303: decodeDictionary
};
module.exports = decoders;

function decodeReturn(value, returnDef, Service) {
    if (!value) {
        return new Buffer(0);
    }
    if (!returnDef) {
        return value;
    }

    return decoders[returnDef.code](value, returnDef, Service);
}

/**
 * Takes in a node.js buffer object representing a `double` and decodes it.
 * @param {ByteBuffer} buffer - The buffer object
 * @return {number|*}
 */
function decodeDouble(buffer) {
    return buffer.readDoubleLE();
}

/**
 * Takes in a node.js buffer object representing a `float` and decodes it.
 * @param {ByteBuffer} buffer - The buffer object
 * @return {number|*}
 */
function decodeFloat(buffer) {
    return buffer.readFloatLE();
}

/**
 * Takes in a node.js buffer object representing a `sInt32` and decodes it.
 * @param {ByteBuffer} buffer - The buffer object
 * @return {number}
 */
function decodeSInt32(buffer) {
    return buffer.readIntLE() / 2;
}

/**
 * Takes in a node.js buffer object representing a `sInt64` and decodes it.
 * @param {ByteBuffer} buffer - The buffer object
 * @return {!Long|!{value: Long, length: number}|!Long|{value: !Long, length: number}}
 */
function decodeSInt64(buffer) {
    return buffer.readIntLE() / 2;
}

/**
 * Takes in a node.js buffer object representing a `uInt32` and decodes it.
 * @param {ByteBuffer} buffer - The buffer object
 * @return {{value, length}|number|!{value: number, length: number}}
 */
function decodeUInt32(buffer) {
    return buffer.readIntLE();
}

/**
 * Takes in a node.js buffer object representing a `uInt64` and decodes it.
 * @param {ByteBuffer} buffer - The buffer object
 * @return {*}
 */
function decodeUInt64(buffer) {
    return buffer.readIntLE();
}

/**
 * Takes in a node.js buffer object representing a `bool` and decodes it.
 * @param {ByteBuffer} buffer - The buffer object
 * @return {boolean}
 */
function decodeBool(buffer) {
    let numericalValue = buffer.readIntLE();
    return Boolean(numericalValue);
}

/**
 * Takes in a node.js buffer object representing a `string` and decodes it.
 * @param {ByteBuffer} buffer - The buffer object
 * @return {string|!{string: string, length: number}|{string, length}}
 */
function decodeString(buffer) {
    return buffer.slice(1).toString('utf8');
}

/**
 * Takes in a node.js buffer object representing `bytes` and removes any header information.
 * @param {ByteBuffer} buffer - The buffer object
 * @return {ByteBuffer}
 */
function decodeBytes(buffer) {
    let length = buffer.readIntLE();
    return buffer.slice(buffer.byteLength-length);
}

function decodeEnum(value, returnDef, Service) {
    value = decoders.sInt32(value);
    let enm = Service.getEnum(returnDef.service, returnDef.name);
    return enm.values[value];
}

function decodeClass(value, returnDef, Service) {
    value = decoders.uInt64(value);
    if (value === 0) {return;}
    let cls = Service.getClass(returnDef.service, returnDef.name);
    let instance = cls.Instances[value];
    if (!instance) {return new cls(value);}
    return instance;
}

function decodeDictionary(value, returnDef, Service) {
    value = proto.Dictionary.decode(value).entries;
    let dict = {};
    for(let e of value) {
        let key = decoders.return(e.key, returnDef.types[0], Service);
        dict[key] = decoders.return(e.value, returnDef.types[1], Service);
    }
    return dict;
}

function decodeList(value, returnDef, Service) {
    value = proto.List.decode(value).items;
    let items = value.map((e)=>{
        return decoders.return(e, returnDef.types[0], Service);
    });
    return items;
}

function decodeSet(value, returnDef, Service) {
    value = proto.Set.decode(value).items;
    let items = value.map((e)=>{
        return decoders.return(e, returnDef.types[0], Service);
    });
    return items;
}

function decodeTuple(value, returnDef, Service) {
    value = proto.Tuple.decode(value).items;
    let items = value.map((e, i)=>{
        return decoders.return(e, returnDef.types[i], Service);
    });
    return items;
}
