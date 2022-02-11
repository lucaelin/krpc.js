# krpc.js
This is a client library for the Kerbal Space Program mod KRPC.
It provides a Object-Oriented and promise-based view to the API exposed by the mod.

See ./browser for a browserified version
See ./lib for nodejs
See ./commonjs for legacy nodejs

## Install
```bash
npm i https://github.com/lucaelin/krpc.js
```

## Example
```javascript
import KRPC from 'krpc.js';

const options = {
    name: 'krpc.js',    // (default)
    host: 'localhost',  // (default)
    rpcPort: 50000,     // (default)
    streamPort: 50001,  // (default)
    streamRate: 20      //hz (default: 0 = unlimited)
};

let krpc = new KRPC(options);


krpc.load().then(async ()=>{
    let sc = krpc.services.spaceCenter;
    let vessel = await sc.activeVessel; // awaiting rpc call
    for (let i = 0; i<10; i++) {
        console.log(await vessel.situtation); // slow, one rpc is executed every time
    }

    vessel.stream('situation');
    for (let i = 0; i<10; i++) {
        console.log(await vessel.situtation); // fast, streamed properties can be resolved immediately
    }

    //yet another way:
    let stream = vessel.stream('situation', (situation)=>console.log(situation));
    setTimeout(()=>stream.remove(), 60*1000);
}).catch(console.error)
```
