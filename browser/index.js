'use strict';
/* global window, document, Client */
/* eslint-disable no-alert */

const options = {
    name: 'krpc.js-browser',
    host: 'localhost',
    rpcPort: 50000,
    streamPort: 50001
};

if(!window.location.hash) {
    window.location.hash = window.prompt('Please enter the servers IP-address or hostname:', 'localhost');
}
options.host = window.location.hash.slice(1);

let c = new Client(options);
c.load().catch(console.error).then(async ()=>{
    let sc = c.services.spaceCenter;
    sc.stream('ut');
    let vessel = await sc.activeVessel;
    vessel.stream('situation');
    let bodyRF = await vessel.orbit.then((o)=>o.body).then((body)=>body.referenceFrame);
    let flight = await vessel.flight(bodyRF);
    flight.stream('surfaceAltitude');
    flight.stream('speed');
    let boundingBox = await vessel.boundingBox(await vessel.referenceFrame);

    setInterval(async ()=>{
        let time = await c.services.spaceCenter.ut;
        let altitude = await flight.surfaceAltitude;
        let altitude2 = altitude+boundingBox[0][1];
        let speed = await flight.speed;

        document.querySelector("#time").innerText = time;
        document.querySelector("#altitude").innerText = altitude;
        document.querySelector("#altitude2").innerText = altitude2;
        document.querySelector("#speed").innerText = speed;
    },10);
});