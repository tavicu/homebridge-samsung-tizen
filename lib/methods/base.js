let request = require('request');

module.exports = class Base {
    constructor(device) {
        this.ip       = device.config.ip;
        this.mac      = device.config.mac;
        this.name     = device.config.name    || 'SamsungTvRemote';
        this.delay    = device.config.delay   || 400;
        this.timeout  = device.config.timeout || 200;

        this.device   = device;
        this.platform = device.platform;
    }

    isActive() {
        return new Promise(resolve => {
            request.get(`http://${this.ip}:8001/api/v2/`, {
                timeout: this.timeout
            }, error => {
                resolve(error ? false : true);
            });
        });
    }

    _encodeName() {
        return new Buffer(this.name).toString('base64');
    }

    _delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms || this.delay));
    }
}