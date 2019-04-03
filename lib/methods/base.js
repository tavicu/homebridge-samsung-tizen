let request = require('request');

module.exports = class BaseMethod {
    constructor(device) {
        this.ip       = device.config.ip;
        this.mac      = device.config.mac;
        this.name     = device.config.name    || 'SamsungTvRemote';
        this.delay    = device.config.delay   || 400;
        this.timeout  = device.config.timeout || 250;

        this.device   = device;
        this.platform = device.platform;
    }

    async pair() {
        return Promise.resolve();
    }

    _encodeName() {
        return new Buffer(this.name).toString('base64');
    }

    _delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms || this.delay));
    }
}