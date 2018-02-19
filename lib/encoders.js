'use strict';
const ByteBuffer = require("bytebuffer");
const Buffer = require("buffer").Buffer;
const proto = require("./proto");

let encoders = {
    argument: encodeArgument,
    double: encodeDouble,
    float: encodeFloat,
    sInt32: encodeSInt32,
    sInt64: encodeSInt64,
    uInt32: encodeUInt32,
    uInt64: encodeUInt64,
    bool: encodeBool,
    string: encodeString,
    bytes: encodeBytes,
    enum: encodeEnum,
    class: encodeClass,
    dictionary: encodeDictionary,
    list: encodeList,
    set: encodeSet,
    tuple: encodeTuple,

    0: ()=>null,

    // Values
    1: encodeDouble,
    2: encodeFloat,
    3: encodeSInt32,
    4: encodeSInt64,
    5: encodeUInt32,
    6: encodeSInt64,
    7: encodeBool,
    8: encodeString,
    9: encodeBytes,

    // Objects
    100: encodeClass,
    101: encodeEnum,

    // Messages
    200: (arg)=>proto.Event.encode(arg).finish(),
    201: (arg)=>proto.ProcedureCall.encode(arg).finish(),
    202: (arg)=>proto.Stream.encode(arg).finish(),
    203: (arg)=>proto.Status.encode(arg).finish(),
    204: (arg)=>proto.Services.encode(arg).finish(),

    // Collections
    300: encodeTuple,
    301: encodeList,
    302: encodeSet,
    303: encodeDictionary
};
module.exports = encoders;

function encodeArgument(arg, parameterDef, Service) {
    if (typeof arg === 'undefined' && parameterDef.defaultValue) {
        return Buffer.from(parameterDef.defaultValue, 'base64');
    }
    return encoders[parameterDef.type.code](arg, parameterDef, Service);
}

/**
 * Takes in a value and encodes it as a `double` stored in a [ByteBuffer]{@link https://www.npmjs.com/package/bytebuffer} object
 * for use with the protobufjs library.
 * @param value - The value to encode.
 * @return {ByteBuffer|void}
 */
function encodeDouble(value) {
    let buffer = new ByteBuffer();
    buffer.limit = 16;
    buffer.littleEndian = true;
    if (value === null) {
        return buffer;
    }
    buffer.writeDouble(value);
    return Buffer.from(buffer.flip().toBuffer());
}

/**
 * Takes in a value and encodes it as a `float` stored in a [ByteBuffer]{@link https://www.npmjs.com/package/bytebuffer} object
 * for use with the protobufjs library.
 * @param value - The value to encode.
 * @return {ByteBuffer|void}
 */
function encodeFloat(value) {
    let buffer = new ByteBuffer();
    buffer.limit = 8;
    buffer.littleEndian = true;
    if (value === null) {
        return buffer;
    }
    buffer.writeFloat(value);
    return Buffer.from(buffer.flip().toBuffer());
}

/**
 * Takes in a value and encodes it as a `sInt32` stored in a [ByteBuffer]{@link https://www.npmjs.com/package/bytebuffer} object
 * for use with the protobufjs library.
 * @param value - The value to encode.
 * @return {ByteBuffer|void}
 */
function encodeSInt32(value) {
    let buffer = new ByteBuffer();
    if (value !== null) {
        buffer.writeVarint32ZigZag(value);
    }
    return Buffer.from(buffer.flip().toBuffer());
}

/**
 * Takes in a value and encodes it as a `sInt64` stored in a [ByteBuffer]{@link https://www.npmjs.com/package/bytebuffer} object
 * for use with the protobufjs library.
 * @param value - The value to encode.
 * @return {ByteBuffer|void}
 */
function encodeSInt64(value) {
    let buffer = new ByteBuffer();
    if (value !== null) {
        buffer.writeVarint64ZigZag(value);
    }
    return Buffer.from(buffer.flip().toBuffer());
}

/**
 * Takes in a value and encodes it as a `uInt32` stored in a [ByteBuffer]{@link https://www.npmjs.com/package/bytebuffer} object
 * for use with the protobufjs library.
 * @param value - The value to encode.
 * @return {ByteBuffer|void}
 */
function encodeUInt32(value) {
    let buffer = new ByteBuffer();
    if (value !== null) {
        buffer.writeVarint32(value);
    }
    return Buffer.from(buffer.flip().toBuffer());
}

/**
 * Takes in a value and encodes it as a `uInt64` stored in a [ByteBuffer]{@link https://www.npmjs.com/package/bytebuffer} object
 * for use with the protobufjs library.
 * @param value - The value to encode.
 * @return {ByteBuffer|void}
 */
function encodeUInt64(value) {
    let buffer = new ByteBuffer();
    if (value !== null) {
        buffer.writeVarint64(value);
    }
    return Buffer.from(buffer.flip().toBuffer());
}

/**
 * Takes in a value and encodes it as a `bool` stored in a [ByteBuffer]{@link https://www.npmjs.com/package/bytebuffer} object
 * for use with the protobufjs library.
 * @param value - The value to encode.
 * @return {ByteBuffer|void}
 */
function encodeBool(value) {
    let buffer = new ByteBuffer();
    if (value !== null) {
        if (typeof value === 'string') {
            buffer.writeVarint32(value.toLowerCase() === 'false' ? 0 : Boolean(value));
        }else{
            buffer.writeVarint32(value ? 1 : 0);
        }
    }
    return Buffer.from(buffer.flip().toBuffer());
}

/**
 * Takes in a value and encodes it as a `string` stored in a [ByteBuffer]{@link https://www.npmjs.com/package/bytebuffer} object
 * for use with the protobufjs library.
 * @param value - The value to encode.
 * @return {ByteBuffer|void}
 */
function encodeString(value) {
    let buffer = new ByteBuffer();
    if (value !== null) {
        buffer.writeVString(value);
    }
    return Buffer.from(buffer.flip().toBuffer());
}

/**
 * Takes in a [ByteBuffer]{@link https://www.npmjs.com/package/bytebuffer} object, prepends header information and encodes it as `bytes`
 * stored in a [ByteBuffer]{@link https://www.npmjs.com/package/bytebuffer} object for use with the protobufjs library.
 * @param value - The value to encode.
 * @return {ByteBuffer|void}
 */
function encodeBytes(value) {
    let buffer = new ByteBuffer();
    if (value !== null) {
        buffer.writeVarint32(value.toBuffer().byteLength);
        value.forEach((v)=>{
            buffer.writeByte(v);
        });
    }
    return Buffer.from(buffer.flip().toBuffer());
}

function encodeEnum(arg, parameterDef, Service) {
    let enm = Service.getEnum(parameterDef.type.service, parameterDef.type.name);
    arg = enm.names[arg];
    return encoders.sInt32(arg);
}

function encodeClass(arg) {
    return encoders.uInt64(arg.id);
}

function encodeDictionary(arg, parameterDef, Service) {
    let entries = [];
    for(let i in arg) {
        let key = encoders.argument(i, {type: parameterDef.type.types[0]}, Service);
        let value = encoders.argument(arg[i], {type: parameterDef.type.types[1]}, Service);
        entries.push({key, value});
    }
    entries = entries.map((e)=>proto.DictionaryEntry.create(e));
    return Buffer.from(ByteBuffer.wrap(proto.Dictionary.encode({entries}).finish()).toBuffer());
}

function encodeList(arg, parameterDef, Service) {
    let items = arg.map((e)=>{
        return encoders.argument(e, {type: parameterDef.type.types[0]}, Service);
    });
    return Buffer.from(ByteBuffer.wrap(proto.List.encode({items}).finish()).toBuffer());
}

function encodeSet(arg, parameterDef, Service) {
    let items = arg.map((e)=>{
        return encoders.argument(e, {type: parameterDef.type.types[0]}, Service);
    });
    return Buffer.from(ByteBuffer.wrap(proto.Set.encode({items}).finish()).toBuffer());
}

function encodeTuple(arg, parameterDef, Service) {
    let items = parameterDef.type.types.map((e,i)=>{
        return encoders.argument(arg[i], {type: e}, Service);
    });
    return Buffer.from(ByteBuffer.wrap(proto.Tuple.encode({items}).finish()).toBuffer());
}
