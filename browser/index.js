'use strict';
/* global window, document, KRPC */
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

let krpc = new KRPC(options);
krpc.load().then(async ()=>{
    let sc = krpc.services.spaceCenter;
    sc.stream('ut');
    let vessel = await sc.activeVessel;
    vessel.stream('situation');
    let bodyRF = await vessel.orbit.then((o)=>o.body).then((body)=>body.referenceFrame);
    let flight = await vessel.flight(bodyRF);
    flight.stream('surfaceAltitude');
    flight.stream('speed');
    let boundingBox = await vessel.boundingBox(await vessel.referenceFrame);

    setInterval(async ()=>{
        let time = await sc.ut;
        let altitude = await flight.surfaceAltitude;
        let altitude2 = altitude+boundingBox[0][1];
        let situation = await vessel.situation;
        let speed = await flight.speed;

        document.querySelector("#time").innerText = time;
        document.querySelector("#altitude").innerText = altitude;
        document.querySelector("#altitude2").innerText = altitude2;
        document.querySelector("#situation").innerText = situation;
        document.querySelector("#speed").innerText = speed;
    },10);
}).catch((e)=>console.error('Error connecting to Vessel:',e));
