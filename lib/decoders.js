import proto from './proto.js';
import {Buffer} from 'buffer';
import ProtoBuf from 'protobufjs';

const decoders = {
    return: decodeReturn,
    double: (buffer)=>decodePrimitive('double', buffer),
    float: (buffer)=>decodePrimitive('float', buffer),
    sInt32: (buffer)=>decodePrimitive('sint32', buffer),
    sInt64: (buffer)=>decodePrimitive('sint64', buffer),
    uInt32: (buffer)=>decodePrimitive('uint32', buffer),
    uInt64: (buffer)=>decodePrimitive('uint64', buffer),
    bool: (buffer)=>decodePrimitive('bool', buffer),
    string: (buffer)=>decodePrimitive('string', buffer),
    bytes: (buffer)=>decodePrimitive('bytes', buffer),
    class: decodeClass,
    enum: decodeEnum,
    tuple: decodeTuple,
    list: decodeList,
    set: decodeSet,
    dictionary: decodeDictionary,

    0: ()=>null,

    // Values
    1: (buffer)=>decodePrimitive('double', buffer),
    2: (buffer)=>decodePrimitive('float', buffer),
    3: (buffer)=>decodePrimitive('sint32', buffer),
    4: (buffer)=>decodePrimitive('sint64', buffer),
    5: (buffer)=>decodePrimitive('uint32', buffer),
    6: (buffer)=>decodePrimitive('uint64', buffer),
    7: (buffer)=>decodePrimitive('bool', buffer),
    8: (buffer)=>decodePrimitive('string', buffer),
    9: (buffer)=>decodePrimitive('bytes', buffer),

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
export default decoders;

export function decodeReturn(value, returnDef, Service) {
    if (!value) {
        return new Buffer(0);
    }
    if (!returnDef) {
        return value;
    }

    return decoders[returnDef.code](value, returnDef, Service);
}

function decodePrimitive(type, buffer) {
    const reader = ProtoBuf.Reader.create(buffer);
    return reader[type]();
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
