WIP...
```javascript
const KRPC = require('.'); // only needed for node

const options = {
    name: 'krpc.js',
    host: 'localhost',
    rpcPort: 50000,
    streamPort: 50001
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
}.catch(console.error)
```
