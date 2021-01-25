import ProtoBuf from 'protobufjs';
import krpc from './krpc.proto.js';

let _root = null;
const proto = {
    load,
    root: function () {
        return _root;
    }
};

async function load() {
    _root = ProtoBuf.Root.fromJSON(krpc).lookup('krpc').nested.schema;
    Object.keys(_root).forEach(function (propertyName) {
        proto[propertyName] = _root[propertyName];
    });
}

export default proto;
