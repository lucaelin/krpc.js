import {Buffer} from 'buffer';
import proto from './proto.js';
import ProtoBuf from 'protobufjs';

const encoders = {
    argument: encodeArgument,
    double: (value)=>encodePrimitive('double', value),
    float: (value)=>encodePrimitive('float', value),
    sInt32: (value)=>encodePrimitive('sint32', value),
    sInt64: (value)=>encodePrimitive('sint64', value),
    uInt32: (value)=>encodePrimitive('uint32', value),
    uInt64: (value)=>encodePrimitive('uint64', value),
    bool: (value)=>encodePrimitive('bool', value),
    string: (value)=>encodePrimitive('string', value),
    bytes: (value)=>encodePrimitive('bytes', value),
    class: encodeClass,
    enum: encodeEnum,
    tuple: encodeTuple,
    list: encodeList,
    set: encodeSet,
    dictionary: encodeDictionary,

    0: ()=>null,

    // Values
    1: (value)=>encodePrimitive('double', value),
    2: (value)=>encodePrimitive('float', value),
    3: (value)=>encodePrimitive('sint32', value),
    4: (value)=>encodePrimitive('sint64', value),
    5: (value)=>encodePrimitive('uint32', value),
    6: (value)=>encodePrimitive('uint64', value),
    7: (value)=>encodePrimitive('bool', value),
    8: (value)=>encodePrimitive('string', value),
    9: (value)=>encodePrimitive('bytes', value),

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
export default encoders;

export function encodeArgument(arg, parameterDef, Service) {
    if (typeof arg === 'undefined' && parameterDef.defaultValue) {
        return Buffer.from(parameterDef.defaultValue, 'base64');
    }
    return encoders[parameterDef.type.code](arg, parameterDef, Service);
}

function encodePrimitive(type, value) {
    return ProtoBuf.Writer.create()[type](value).finish();
}

function encodeEnum(arg, parameterDef, Service) {
    let enm = Service.getEnum(parameterDef.type.service, parameterDef.type.name);
    if (typeof arg === 'string') {
        arg = enm.names[arg];
    } else if (typeof arg !== 'number') {
        throw new Error("Enum value '" + arg + "' not of any compatible type");
    }
    if (typeof arg === 'undefined') {
        throw new Error("Unable to encode enum, no value found");
    }
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
