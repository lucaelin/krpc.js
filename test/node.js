import KRPC from '../lib/KRPC.js';

const options = {
    name: 'krpc.js-browser',
    host: 'localhost',
    rpcPort: 50000,
    streamPort: 50001
};

function expectEq(t, a, b) {
    if (a !== b) {
        console.error("Test ", t, "failed. Expected", typeof a, a, "to be equal to", typeof b, b);
        process.exit(2);
    }
}
async function expectEf(t, a, f) {
    if ((await f(a)) !== true) {
        console.error("Test", t, "failed. Expected function", f.toString(), "to fullfill on", typeof a, a);
        process.exit(2);
    }
}

const krpc = new KRPC(options);
krpc.load().then(async ()=>{
    const ts = krpc.services.testService;

    const eq = async (t, ...args)=>{
        const exp = args.pop();
        if (typeof exp === 'function')
            return expectEf(t, await ts[t](...args), exp);
        return expectEq(t, await ts[t](...args), exp);
    };

    const ee = async (name, fn, type, ...args)=>{
        let ret;
        try {
            ret = await ts[fn](...args);
        } catch(e) {
            switch (type) {
                case 'native':
                    return expectEf(fn, e, e=>e instanceof Error);
                case 'description':
                    return expectEf(fn, e.description, d=>d.includes(name));
                case 'named':
                default:
                    return expectEq(fn, e.name, name);
            }
        }
        return expectEf(fn, ret, _=>false);
    };

    const res = await Promise.all([
        eq('floatToString', 0.00001, '1E-05'),
        eq('floatToString', 0.11111, '0.11111'),
        eq('floatToString', 0.11111111111111111, '0.1111111'),
        eq('doubleToString', 0.00000000000000001, '1E-17'),
        eq('doubleToString', 0.11111111111111111, '0.111111111111111'),
        eq('int32ToString', 2147483647, (2147483647).toString()),
        eq('int64ToString', Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER.toString()),
        eq('boolToString', true, 'True'),
        eq('stringToInt32', '1001', 1001),
        eq('bytesToHexString', Buffer.from([0,4,8,15,16]), '0004080f10'),
        eq('addMultipleValues', 1, 2, 3, -3, 0.5, '6'),
        eq('createTestObject', 'testString', res => res.id > 0 && res.className === 'TestClass'),
        (async ()=>{
            const testObject = await ts.createTestObject('toastString');
            return eq('echoTestObject', testObject, res =>
                res.id === testObject.id &&
                res.className === testObject.className
            );
        })(),
        ee('ReturnNullWhenNotAllowed', 'returnNullWhenNotAllowed', 'description'),
        eq('optionalArguments', 'hi', 'hifoobarnull'),
        eq('optionalArguments', 'hi', 'baz', 'hibazbarnull'),
        //eq('optionalArguments', 'hi', 'baz', 'boz', 10, 'hibazboznull'), // TODO add optional object as null
        eq('enumReturn', 'ValueB'),
        eq('enumEcho', ts.TestEnum.ValueA, 'ValueA'),
        eq('enumDefaultArg', 'ValueC'),
        eq('blockingProcedure', 2, 3),
        //eq('incrementList', [2], a=>a.length > 0), // TODO figure out what this is actually supposed to do
        //eq('incrementDictionary', {x: 1}, a=>a.length > 0), // TODO figure out what this is actually supposed to do
        //eq('incrementSet', [2], a=>a.length > 0), // TODO figure out what this is actually supposed to do
        //eq('incrementTuple', [2], a=>a.length > 0), // TODO figure out what this is actually supposed to do
        //eq('incrementNestedCollection', [{x:1}], a=>a.length > 0), // TODO figure out what this is actually supposed to do
        eq('tupleDefault', ([n, b]) => n === 1 && b === false),
        eq('listDefault', ([one, two, three]) => one === 1 && two === 2 && three === 3),
        eq('setDefault', ([one, two, three]) => one === 1 && two === 2 && three === 3),
        eq('dictionaryDefault', obj => obj['1'] === false && obj['2'] === true),
        eq('counter', 1),
        eq('counter', 2),
        eq('counter', 3),
        eq('addToObjectList', [], 'hi', ([{id, className}]) => id > 0 && className === 'TestClass'),
        ee('InvalidOperationException', 'throwInvalidOperationException'),
        (async ()=>{
            const promises = [];
            await eq('resetInvalidOperationExceptionLater', undefined);
            for (let x = 0; x<=100; x++) {
                promises.push(eq('throwInvalidOperationExceptionLater', 0));
            }
            await Promise.all(promises);
            await ee('InvalidOperationException', 'throwInvalidOperationExceptionLater');
        })(),
        ee('ArgumentException', 'throwArgumentException'),
        ee('ArgumentNullException', 'throwArgumentNullException', 'named', ''),
        ee('ArgumentOutOfRangeException', 'throwArgumentOutOfRangeException', 'named', ''),
        ee('CustomException', 'throwCustomException'),
        (async ()=>{
            const promises = [];
            await eq('resetCustomExceptionLater', undefined);
            for (let x = 0; x<=100; x++) {
                promises.push(eq('throwCustomExceptionLater', 0));
            }
            await Promise.all(promises);
            await ee('CustomException', 'throwCustomExceptionLater');
        })(),
        (async ()=>{
            const testObject = await ts.createTestObject('test-'+Math.random().toString());
            const streamValue = await new Promise(res=>testObject.stream('intProperty', res));
            expectEq('streamedIntProperty', streamValue, 0);
            const nextValue = new Promise(res=>testObject.stream('intProperty', res));
            await (testObject.intProperty = 10);
            expectEq('streamedIntProperty', await nextValue, 10);
        })(),
        eq('onTimer', 100, 10, e=>new Promise(res=>{
            let x = 0;
            e.listen(()=>{
                x++;
                if (x === 10) res(true);
            });
        })),
        eq('onTimerUsingLambda', 200, e=>new Promise(res=>{
            e.listen(()=>res(true));
        })),
    ]);

    console.log(res.length, 'tests passed');
    console.log('Testing performance');

    await (async ()=>{
        const samples = 100;
        const start = Date.now();
        for(let x = 0; x<=samples; x++) {
            await ts.floatToString(Math.PI);
        }
        const end = Date.now();
        const duration = end-start;
        console.log('Sequential performance:', samples, 'samples took', duration, 'ms');
        expectEf('sequentialPerformance', duration, d=>d<10000); // ensure the test doesn't take longer than 10s
    })();

    await (async ()=>{
        const samples = 10000;
        const start = Date.now();
        const promises = [];
        for(let x = 0; x<=samples; x++) {
            promises.push(ts.floatToString(Math.PI));
        }
        await Promise.all(promises);
        const end = Date.now();
        const duration = end-start;
        console.log('Parallel performance:', samples, 'samples took', duration, 'ms');
        expectEf('sequentialPerformance', duration, d=>d<5000); // ensure the test doesn't take longer than 5s
    })();

    console.log('All tests passed!');
    process.exit(0);
}).catch((e)=>{
    console.error('Error connecting to Vessel:',e);
    process.exit(1);
});
