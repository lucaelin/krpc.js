'use strict';
const WebSocket = require('ws');
const _ = require('lodash');
const proto = require('./proto');
const Buffer = require('buffer').Buffer;
//const EventEmitter = require('events');
const Service = require('./Service');
const kRPCService = require('./krpc-service-legacy');

let defaultOptions = {
    name: 'krpc.js',
    host: '127.0.0.1',
    rpcPort: 50000,
    streamPort: 50001,
    wsOptions: {},
    wsProtocols: []
};

module.exports = class KRPC {
    constructor(options) {
        this.options = options;
        _.defaults(this.options, defaultOptions);

        this.callbackStack = [];
        this.decodeStack = [];
        this.rpc = {
            socket: null,
            cache: []
        };
        this.stream = {
            socket: null,
            cache: []
        };
        this.services = {krpcLegacy: kRPCService};
        this.streams = {};
        this.streamLink = {};
        this.streamState = {
            get: (path)=>{
                _.get(this.streamState, path);
            },
            set: (path, value)=>{
                if(typeof value === 'undefined') {
                    _.unset(this.streamState, path);
                }
                _.set(this.streamState, path, value);
            }
        };
    }

    async load() {
        await proto.load();
        await this.connectToRPCServer();
        await this.connectToStreamServer();
        await this.createServices();
        return this;
    }

    close() {
        this.rpc.socket.close();
        this.stream.socket.close();
        this.callbackStack = [];
        this.decodeStack = [];
    }

    connectToRPCServer() {
        return new Promise((resolve, reject)=>{
            let url = 'ws://' + this.options.host + ':' + this.options.rpcPort.toString()+ '?name=' + this.options.name;
            this.rpc.socket = new WebSocket(url, this.options.wsProtocols, this.options.wsOptions);
            this.rpc.socket.binaryType = 'arraybuffer';
            this.rpc.socket.addEventListener('error', (event)=>console.error('TODO: rpc connection error:', event));
            this.rpc.socket.addEventListener('close', (event)=>console.error('TODO: rpc connection close:', event));
            this.rpc.socket.addEventListener('message', (event)=>{
                try {
                    this.onMessage(event.data);
                } catch (e) {
                    this.onMessageError(e);
                    reject(e);
                    //console.error('Unexpected exception processing RPC-Message:', e);
                }
            });
            this.rpc.socket.addEventListener('open', async ()=>{
                let response = await this.send(kRPCService.getClientId());
                this.clientId = response.results[0].value.toString('base64');
                resolve(this.clientId);
            }, {once: true});
        });
    }

    connectToStreamServer() {
        return new Promise((resolve, reject)=>{
            let url = 'ws://' + this.options.host + ':' + this.options.streamPort.toString()+ '?id=' + this.clientId;
            this.stream.socket = new WebSocket(url, this.options.wsProtocols, this.options.wsOptions);
            this.stream.socket.binaryType = 'arraybuffer';
            this.stream.socket.addEventListener('error', (event)=>console.error('TODO: stream connection error:', event));
            this.stream.socket.addEventListener('close', (event)=>console.error('TODO: stream connection close:', event));
            this.stream.socket.addEventListener('message', (event)=>{
                try {
                    this.onStreamMessage(event.data);
                } catch (e) {
                    //this.onStreamError(e);
                    reject();
                    console.error('Unexpected exception processing Stream-Message:', e);
                }
            });
            this.stream.socket.addEventListener('open', resolve, {once: true});
        });
    }

    async createServices() {
        let response = await this.send(kRPCService.getServices());
        let services = response.results[0].value.services.map((service)=>new Service(service, (call)=>this.send(call), (stream, cb)=>this.addStream(stream, cb)));

        services.forEach((service)=>{
            this.services[_.camelCase(service.name)] = service;
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
        let response = this.decodeMessage(data, proto.Response);
        if(!response) {return;}

        if(response.error) {
            return this.onMessageError(response.error);
        }

        response.results = response.results.map((result)=>{
            let decode = this.decodeStack.pop();
            if (result.error || decode === null) {
                return result;
            }
            result.value = decode(Buffer.from(result.value));
            return result;
        });
        //this.rpc.emitter.emit('message', response, data);
        if (this.callbackStack.length > 0) {
            let promise = this.callbackStack.pop();
            return promise.resolve(response);
        }
    }
    onMessageError(err) {
        //this.rpc.emitter.emit('error', err);
        if (this.callbackStack.length > 0) {
            this.decodeStack.pop();
            let promise = this.callbackStack.pop();
            return promise.reject(err);
        }
    }

    onStreamMessage(data) {
        let streamUpdate = this.decodeMessage(data, proto.StreamUpdate);
        if(!streamUpdate) {return;}

        if (Object.keys(this.streams).length === 0) {
            return; //this.stream.emitter.emit('message', streamUpdate, data);
        }
        streamUpdate.results.forEach((update)=>{
            if (update.result.error) {
                // this.stream.emitter.emit('error', update.result.error);
                return;
            }
            let stream = this.streams[update.id.toString()];
            if (!stream) {
                return;
            }

            let decodedValue = stream.decode(update.result.value);
            stream.callback(decodedValue);
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

        let procedureCalls = [];
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
        let req = proto.Request.create({calls: procedureCalls});
        let buffer = proto.Request.encode(req).finish();

        this.rpc.socket.send(buffer);
        return new Promise((resolve, reject)=>{
            this.callbackStack.splice(0, 0, {resolve, reject});
        });
    }

    /* eslint-disable complexity */
    async addStream(procedure, callback) {
        if (procedure instanceof Array) {
            throw new Error("You can only pass one procedure call to `client.addStream` at a time.");
        }
        if (!procedure.call) {
            throw new Error("Procedure must have a call property on it.");
        }

        let stream = await this.services.krpc.addStream(procedure.call);

        if(stream.error) {
            throw stream.error;
        }

        this.streams[stream.id.toString()] = {
            callback: callback,
            decode: procedure.decode,
            id: stream.id
        };
        return stream;
    }
    async removeStream(callback) {
        let existingStream = [];
        for(let stream of this.streams) {
            if(stream.callback === callback) {
                existingStream = stream;
            }
        }
        if (!existingStream) {
            throw new Error(`streamState.$(propertyPath) was not set and cannot be removed.`);
        }
        let removeStream = kRPCService.removeStream(existingStream.id);

        let response = await this.send(removeStream);

        if (response.error) {
            throw new Error(response.error);
        }
        let firstResult = response.results[0];
        if (firstResult.error) {
            throw new Error(firstResult.error);
        }
        delete this.streams[existingStream.id.toString()];
        return;
    }
};
