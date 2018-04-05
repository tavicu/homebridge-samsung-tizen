let exec = require('child_process').exec;
let WebSocket = require('ws');
let { base64Encode } = require('../utils');

module.exports = class SamsungRemote {
    constructor(log, config) {
        this.log    = log;
        this.name   = config.name || 'SamsungTvRemote';
        this.ip     = config.ip   || '192.168.1.0';
        this.mac    = config.mac  || '00:00:00:00';
        this.port   = config.port || 8001;

        this.remote = `http://${this.ip}:${this.port}/api/v2/`;
    }

    isOn () {
        return new Promise(resolve => {
            exec('ping -t 1 -c 1 ' + this.ip, (error) => resolve(error ? false : true));
        });
    }

    turnOn() {

    }

    turnOff() {

    }

    setChannel() {

    }

}