import proto from './proto.js';
import {Buffer} from 'buffer';
import ByteBuffer from 'bytebuffer';
import ProtoBuf from 'protobufjs';

const decoders = {
    return: decodeReturn,
    double: (buffer)=>decode('double', buffer),
    float: (buffer)=>decode('float', buffer),
    sInt32: (buffer)=>decode('sint32', buffer),
    sInt64: (buffer)=>decode('sint64', buffer),
    uInt32: (buffer)=>decode('uint32', buffer),
    uInt64: (buffer)=>decode('uint64', buffer),
    bool: (buffer)=>decode('bool', buffer),
    string: (buffer)=>decode('string', buffer),
    bytes: (buffer)=>decode('bytes', buffer),
    enum: decodeEnum,
    class: decodeClass,
    dictionary: decodeDictionary,
    list: decodeList,
    set: decodeSet,
    tuple: decodeTuple,

    0: ()=>null,

    // Values
    1: (buffer)=>decode('double', buffer),
    2: (buffer)=>decode('float', buffer),
    3: (buffer)=>decode('sint32', buffer),
    4: (buffer)=>decode('sint64', buffer),
    5: (buffer)=>decode('uint32', buffer),
    6: (buffer)=>decode('uint64', buffer),
    7: (buffer)=>decode('bool', buffer),
    8: (buffer)=>decode('string', buffer),
    9: (buffer)=>decode('bytes', buffer),

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

function decodeReturn(value, returnDef, Service) {
    if (!value) {
        return new Buffer(0);
    }
    if (!returnDef) {
        return value;
    }

    return decoders[returnDef.code](value, returnDef, Service);
}

function decode(name, buffer) {
    const reader = ProtoBuf.Reader.create(buffer);
    return reader[name]();
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
