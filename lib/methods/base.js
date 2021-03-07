let fetch           = require('node-fetch');
let isPortReachable = require('is-port-reachable');

module.exports = class BaseMethod {
    constructor(device) {
        this.ip      = device.config.ip;
        this.mac     = device.config.mac;
        this.name    = device.config.name    || 'SamsungTvRemote';
        this.delay   = device.config.delay   || 400;
        this.timeout = device.config.timeout || 250;

        this.device  = device;
        this.cache   = device.cache;
    }

    async pair() {
        return this._delay(500);
    }

    /**
     * Get status of TV with cache
     * @return {Cache}
     */
    getActive() {
        return this.cache.get('active', () => this.getActivePing().then(status => {
            if (status) {
                return this.cache.get('active-http', () => this.getActiveHttp(), 5000);
            } else {
                this.cache.forget('active-http');
            }

            return status;
        }), 400);
    }

    /**
     * Get status of TV by sending a Ping
     * @return {Promise}
     */
    getActivePing() {
        return isPortReachable(8001, {
            host: this.ip,
            timeout: this.timeout
        });
    }

    /**
     * Get status of TV from PowerState response
     * @return {Promise}
     */
    getActiveHttp() {
        return this.getInfo().then(data => {
            if (data.device && data.device.PowerState) {
                return data.device.PowerState == 'on';
            }

            return true;
        })
        .catch(() => false);
    }

    /**
     * Get TV informations
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
     * @param  {Number} appId
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
     * @param  {Number} appId
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
     * @return {string}
     */
    _encodeName() {
        return new Buffer.from(this.name).toString('base64');
    }

    /**
     * Function to add delay
     * @param  {Number} ms
     * @return {Promise}
     */
    _delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms || this.delay));
    }
}