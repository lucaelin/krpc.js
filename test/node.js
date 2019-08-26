import KRPC from '../lib/KRPC.js';

const options = {
    name: 'krpc.js-browser',
    host: 'localhost',
    rpcPort: 50000,
    streamPort: 50001
};

const krpc = new KRPC(options);
krpc.load().then(async ()=>{
    const sc = krpc.services.spaceCenter;
    const vessel = await sc.activeVessel;
    const time = await sc.ut;
    const situation = await vessel.situation;
    if (typeof time === 'number' && typeof situation === 'string') {
        console.log('Tests passed.')
        process.exit(0);
    } else {
        console.error('Invalid return types');
        process.exit(2);
    }
}).catch((e)=>{
    console.error('Error connecting to Vessel:',e);
    process.exit(1);
});
