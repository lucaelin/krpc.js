import WebSocket from 'ws';
import { camelCase } from 'lodash-es';
import proto from './proto.js';
import {Buffer} from 'buffer';
import Service from './Service.js';
import * as kRPCService from './krpc-service-legacy.js';

const defaultOptions = {
    name: 'krpc.js',
    host: '127.0.0.1',
    rpcPort: 50000,
    streamPort: 50001,
    streamRate: 0,
    wsOptions: {},
    wsProtocols: [],
    closeOnConnectionError: true,
};

export default class KRPC {
    constructor(options) {
        this.options = { ...defaultOptions, ...options };

        this.callbackStack = [];
        this.decodeStack = [];
        this.rpcSocket = null;
        this.streamSocket = null;
        this.services = { krpcLegacy: kRPCService };
        this.streams = {};
    }

    async load() {
        await proto.load();
        await this.connectToRPCServer();
        await this.connectToStreamServer();
        await this.createServices();
        return this;
    }

    close() {
        this.rpcSocket.close();
        if (this.streamSocket) this.streamSocket.close();
        while (this.callbackStack.length) {
            this.callbackStack.pop().reject('Connection closed.');
        }
        this.decodeStack = [];
        this.streams = {};
    }

    connectToRPCServer() {
        return new Promise((resolve, reject)=>{
            const url = 'ws://' + this.options.host + ':' + this.options.rpcPort.toString()+ '?name=' + this.options.name;
            this.rpcSocket = new WebSocket(url, this.options.wsProtocols, this.options.wsOptions);
            this.rpcSocket.binaryType = 'arraybuffer';
            this.rpcSocket.addEventListener('error', (event)=>{
                reject(event.error);
                console.error('Received rpcSocket error event:', event);
                if (this.options.failOnConnectionError) this.close();
            });
            this.rpcSocket.addEventListener('close', (event)=>{
                const message = `RPC connection close: ${event.code} ${event.reason}`;
                reject(new Error(message));
                this.close();
                console.error(message);
            });
            this.rpcSocket.addEventListener('message', (event)=>{
                try {
                    this.onMessage(event.data);
                } catch (e) {
                    this.onMessageError(e);
                    reject(e);
                    //console.error('Unexpected exception processing RPC-Message:', e);
                }
            });
            this.rpcSocket.addEventListener('open', async ()=>{
                const response = await this.send(kRPCService.getClientId());
                this.clientId = response.results[0].value.toString('base64');
                resolve(this.clientId);
            }, {once: true});
        });
    }

    connectToStreamServer() {
        return new Promise((resolve, reject)=>{
            const url = 'ws://' + this.options.host + ':' + this.options.streamPort.toString()+ '?id=' + this.clientId;
            this.streamSocket = new WebSocket(url, this.options.wsProtocols, this.options.wsOptions);
            this.streamSocket.binaryType = 'arraybuffer';
            this.streamSocket.addEventListener('error', (event)=>{
                reject(event.error);
                console.error('Received streamSocket error event:', event);
                if (this.options.failOnConnectionError) this.close();
            });
            this.streamSocket.addEventListener('close', (event)=>console.warn('Stream connection close:', event));
            this.streamSocket.addEventListener('message', (event)=>{
                try {
                    this.onStreamMessage(event.data);
                } catch (e) {
                    //this.onStreamError(e);
                    reject();
                    console.error('Unexpected exception processing Stream-Message:', e);
                }
            });
            this.streamSocket.addEventListener('open', resolve, {once: true});
        });
    }

    async createServices() {
        const response = await this.send(kRPCService.getServices());
        const services = response.results[0].value.services.map((service)=>
            new Service(
                service,
                (call)=>this.send(call),
                (call, update, remove)=>this.addStream(call, update, remove),
                (stream)=>this.addEvent(stream)
            )
        );

        services.forEach((service)=>{
            this.services[camelCase(service.name)] = service;
        });
    }

    decodeMessage(buffer, decoder) {
        buffer = Buffer.from(buffer);

        try {
            return decoder.decode(buffer);
        }
        catch (error) {
            let problem;
            try {
                problem = proto.Error.decode(buffer);
            }
            catch (errorError) {
                try {
                    problem = buffer.toString('utf-8');
                }
                catch (parsingError) {
                    problem = "Error parsing binary data :" + parsingError.message;
                    problem = error.message + '\n' + problem + '\n' + error.decoded;
                }
            }
            console.error(error, problem);
            return this.onMessageError(problem);
        }
    }

    onMessage(data) {
        const response = this.decodeMessage(data, proto.Response);
        if(!response) {return;}

        if(response.error) {
            return this.onMessageError(response.error);
        }

        response.results.forEach((result)=>{
            const decode = this.decodeStack.pop();
            if (decode === undefined) {
                throw new Error('Decode stack misalignment!');
            } else if (!result.error && typeof decode === 'function') {
                result.value = decode(Buffer.from(result.value));
            }
        });
        //this.rpc.emitter.emit('message', response, data);
        if (this.callbackStack.length > 0) {
            const promise = this.callbackStack.pop();
            return promise.resolve(response);
        }
    }
    onMessageError(err) {
        //this.rpc.emitter.emit('error', err);
        console.error('Message Error', err);
        this.decodeStack.pop();

        if (this.callbackStack.length > 0) {
            const promise = this.callbackStack.pop();
            return promise.reject(err);
        }
    }

    onStreamMessage(data) {
        const streamUpdate = this.decodeMessage(data, proto.StreamUpdate);
        if(!streamUpdate) {return;}

        if (Object.keys(this.streams).length === 0) {
            return; //this.stream.emitter.emit('message', streamUpdate, data);
        }
        streamUpdate.results.forEach((update)=>{
            if (update.result.error) {
                // this.stream.emitter.emit('error', update.result.error);
                return;
            }
            const stream = this.streams[update.id.toString()];
            if (!stream) {
                console.error('Received invalid stream id', update.id);
                return;
            }

            const decodedValue = stream.decode(update.result.value);
            stream.callbacks.forEach((f)=>{
                try {
                    f(decodedValue);
                } catch(e) {
                    console.error(e);
                }
            });
        });
        // return this.stream.emitter.emit('message', streamUpdate, data);
    }

    async send(calls) { // IDEA: collect calls till next tick (setTimeout(..., 0)), then batch send them
        return await this.sendRequest(calls);
    }

    sendRequest(calls) {
        if (!calls) {
            throw new Error("The calls argument must be provided when calling sendRequest");
        }
        if (typeof calls !== 'object') {
            throw new Error("The calls argument must either be an object or an array of objects when calling sendRequest");
        }
        if (!(calls instanceof Array)) {
            calls = [calls];
        }

        const procedureCalls = [];
        calls.forEach((call)=>{
            if (typeof call.call === 'undefined') {
                throw new Error("Each call added must have both a call and decode property, missing call");
            }
            if (typeof call.decode === 'undefined') {
                throw new Error("Each call added must have both a call and decode property, missing decode");
            }
            this.decodeStack.splice(0, 0, call.decode);
            procedureCalls.push(call.call);
        });
        const req = proto.Request.create({calls: procedureCalls});
        const buffer = proto.Request.encode(req).finish();
        const callbacks = {
          resolve: ()=>console.error('Callbacks not ready!'),
          reject: ()=>console.error('Callbacks not ready!'),
        };
        this.callbackStack.splice(0, 0, callbacks);

        this.rpcSocket.send(buffer);
        return new Promise((resolve, reject)=>{
          callbacks.resolve = resolve;
          callbacks.reject = reject;
        });
    }

    async addStream(procedure, onUpdate, onDelete) {
        if (procedure instanceof Array) {
            throw new Error("You can only pass one procedure call to `client.addStream` at a time.");
        }
        if (!procedure.call) {
            throw new Error("Procedure must have a call property on it.");
        }

        // IDEA: find existing streams by procedure TODO: because removing streams might conflict with pending stream adds
        const stream = await this.services.krpc.addStream(procedure.call);

        while (this.streams[stream.id.toString()] && this.streams[stream.id.toString()].invalid) {
            await this.removeStream(this.streams[stream.id.toString()]);
            stream = await this.services.krpc.addStream(procedure.call);
        }

        if (stream.error) {
            throw stream.error;
        }

        return this.registerStream(procedure, stream, onUpdate, onDelete);
    }
    registerStream(procedure, stream, onUpdate, onDelete) {
        let s = this.streams[stream.id.toString()];

        if (!s || s.invalid) {
            s = {
                callbacks: [],
                removeCallbacks: [],
                decode: procedure.decode,
                id: stream.id,
                remove: ()=>this.removeStream(s),
                setRate: (r)=>this.setStreamRate(s, r)
                // IDEA: make class Stream extends EventTarget
            };

            if(this.options.streamRate !== 0) {
                s.setRate(this.options.streamRate);
            }
        }

        if(onUpdate) {
            this.send(procedure).then((r)=>r.results[0].value).then(onUpdate);
            s.callbacks.push(onUpdate);
        }
        if(onDelete) {
            s.removeCallbacks.push(onDelete);
        }
        this.streams[stream.id.toString()] = s;
        const si = {
            call: procedure.call,
            stream: s,
            handler: onUpdate,
            remove: ()=>{
                si.invalid = true;
                si.stream.callbacks = si.stream.callbacks.filter((i)=>i!==si.handler);
                if (!si.stream.callbacks.length) {si.stream.remove();}
            }
        };
        return si;
    }
    async addEvent(stream) {
        let s = this.streams[stream.id.toString()];

        if (!s || s.invalid) {
            s = {
                callbacks: [],
                removeCallbacks: [],
                decode: ()=>undefined,
                id: stream.id,
                remove: ()=>this.removeStream(s),
                setRate: (r)=>this.setStreamRate(s, r)
                // IDEA: make class Stream extends EventTarget
            };

            if(this.options.streamRate !== 0) {
                s.setRate(this.options.streamRate);
            }
        }

        const handlers = [];
        const handler = ()=>{
            for (const h of handlers) {
                try {
                    h();
                } catch(e) {
                    console.error(e);
                }
            }
        }
        s.callbacks.push(handler);

        this.streams[stream.id.toString()] = s;

        const si = {
            started: false,
            stream: s,
            handlers: handlers,
            listen: async (cb)=>{
                if (typeof cb === 'function') si.handlers.push(cb);
                return this.services.krpc.startStream(stream.id).then(()=>{si.started = true;});
            },
            remove: ()=>{
                si.invalid = true;
                si.stream.callbacks = si.stream.callbacks.filter((i)=>i!==handler);
                if (!si.stream.callbacks.length) {si.stream.remove();}
            }
        };
        return si;
    }
    async setStreamRate(stream, rate) {
        const setRate = kRPCService.setStreamRate(stream.id, rate);

        const response = await this.send(setRate);

        if (response.error) {
            throw new Error(response.error);
        }
        const firstResult = response.results[0];
        if (firstResult.error) {
            throw new Error(firstResult.error);
        }
        return;
    }
    async removeStream(stream) {
        stream.invalid = true;
        stream.callbacks = [];
        stream.removeCallbacks.forEach((f)=>{
            try {
                f();
            } catch(e) {
                console.error(e);
            }
        });
        stream.removeCallbacks = [];

        const removeStream = kRPCService.removeStream(stream.id);

        const response = await this.send(removeStream);

        if (response.error) {
            throw new Error(response.error);
        }
        const firstResult = response.results[0];
        if (firstResult.error) {
            throw new Error(firstResult.error);
        }
        // IDEA: find out why deletion at this place causes streams with removed id's to be created as new
        // maybe the server has a timing issue, where streams that were removed would be assumed valid in the same tick?
        // delete this.streams[stream.id.toString()];
        return;
    }
};
