'use strict';
require('../../init');
let Client = require('../../../lib/client');
const async = require('async');

describe('Decoding - bytes', function () {
    it('Should be able to decode a `bytes` successfully', async function (done) {
        let client = new Client();
        await client.load();
        let clientId = await client.services.kRPC.getClientId();
        expect(clientId.toString('base64').length).to.equal(24);
        done(clientId);
    });
});
