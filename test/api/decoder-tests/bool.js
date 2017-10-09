'use strict';
require('../../init');
let Client = require('../../../lib/client');

describe('Decoding - bool', function () {
    it('Should be able to decode a `bool` successfully', async function (done) {
        let client = new Client();
        await client.load();
        let vessel = await client.services.spaceCenter.activeVessel;
        let control = await vessel.control;
        done(await control.breaks);
    });
});
