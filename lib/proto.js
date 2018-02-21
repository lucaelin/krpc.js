'use strict';
const ProtoBuf = require('protobufjs');
const krpc = require('./krpc.proto.json');

let _root = null;
module.exports = {
    load,
    root: function () {
        return _root;
    }
};

async function load() {
    _root = ProtoBuf.Root.fromJSON(krpc).lookup('krpc').nested.schema;
    Object.keys(_root).forEach(function (propertyName) {
        module.exports[propertyName] = _root[propertyName];
    });
}
