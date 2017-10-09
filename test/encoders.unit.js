'use strict';
require('./init.js');
let encoders = require('../lib/encoders');
let decoders = require('../lib/decoders');
let Long = require('long');

describe('Encoders', function () {
    describe('Double', function () {
        it('value should equal decode(encode(value))', function () {
            let value = 0.5;
            let buffer = encoders.double(value);
            let decoded = decoders.double(buffer);
            expect(decoded).to.equal(value);
        });
    });
    describe('Float', function () {
        it('value should equal decode(encode(value))', function () {
            let value = 0.5;
            let buffer = encoders.float(value);
            let decoded = decoders.float(buffer);
            expect(decoded).to.equal(value);
        });
    });
    describe('sInt32', function () {
        it('value should equal decode(encode(value))', function () {
            let value = 12;
            let buffer = encoders.sInt32(value);
            let decoded = decoders.sInt32(buffer);
            expect(decoded).to.equal(value);
        });
    });
    describe('sInt64', function () {
        it('value should equal decode(encode(value))', function () {
            let value = new Long(12);
            let buffer = encoders.sInt64(Number(value.toString()));
            let decoded = decoders.sInt64(buffer);
            expect(decoded.toString()).to.equal(value.toString());
        });
    });
    describe('uInt32', function () {
        it('value should equal decode(encode(value))', function () {
            let value = 12;
            let buffer = encoders.uInt32(value);
            let decoded = decoders.uInt32(buffer);
            expect(decoded).to.equal(value);
        });
    });
    describe('uInt64', function () {
        it('value should equal decode(encode(value))', function () {
            let value = new Long(12);
            let buffer = encoders.uInt64(Number(value.toString()));
            let decoded = decoders.uInt64(buffer);
            expect(decoded.toString()).to.equal(value.toString());
        });
    });
    describe('bool', function () {
        it('value should equal decode(encode(value))', function () {
            let value = true;
            let buffer = encoders.bool(value);
            let decoded = decoders.bool(buffer);
            expect(decoded).to.equal(value);
        });
    });
    describe('string', function () {
        it('value should equal decode(encode(value))', function () {
            let value = "This value should get encoded and still be readable!";
            let buffer = encoders.string(value);
            let decoded = decoders.string(buffer);
            expect(decoded).to.equal(value);
        });
    });
});
