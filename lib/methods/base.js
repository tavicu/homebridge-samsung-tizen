let fetch = require('node-fetch');

module.exports = class BaseMethod {
    constructor(device) {
        this.ip       = device.config.ip;
        this.mac      = device.config.mac;
        this.name     = device.config.name    || 'SamsungTvRemote';
        this.delay    = device.config.delay   || 400;
        this.timeout  = device.config.timeout || 250;

        this.device   = device;
    }

    async pair() {
        return Promise.resolve();
    }

    /**
     * Get TV informations
     *
     * @return {Promise}
     */
    getInfo() {
        return fetch(`http://${this.ip}:8001/api/v2/`, {
            timeout: this.timeout
        })
        .then(body => body.json());
    }

    /**
     * Get Application Informations
     *
     * @param  {integer} appId
     * @return {Promise}
     */
    getApplication(appId) {
        return fetch(`http://${this.ip}:8001/api/v2/applications/${appId}`, {
            timeout: this.timeout
        })
        .then(body => body.json());
    }

    /**
     * Launch Application
     *
     * @param  {integer} appId
     * @return {Promise}
     */
    startApplication(appId) {
        return fetch(`http://${this.ip}:8001/api/v2/applications/${appId}`, {
            method: 'POST',
            timeout: this.timeout
        })
        .then(body => body.json());
    }

    /**
     * Encode TV name to base64
     *
     * @return {string}
     */
    _encodeName() {
        return new Buffer.from(this.name).toString('base64');
    }

    /**
     * Function to add delay
     *
     * @param  {integer} ms
     * @return {Promise}
     */
    _delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms || this.delay));
    }
}