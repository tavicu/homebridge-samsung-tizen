let wol             = require('wakeonlan');
let fetch           = require('node-fetch');
let isPortReachable = require('is-port-reachable');

const {
    WoLFailedError
} = require('../errors');

module.exports = class Base {
    constructor(device) {
        this.ip      = device.config.ip;
        this.mac     = device.config.mac;
        this.name    = device.config.name    || 'SamsungTvRemote';
        this.delay   = device.config.delay   || 400;
        this.timeout = device.config.timeout || 250;

        this.device  = device;
        this.cache   = device.cache;
    }

    destroy() {
        this.destroyed = true;
    }

    pair() {
        return this._delay(500);
    }

    /**
     * Get status of TV with cache
     * @return {Cache}
     */
    getActive() {
        return this.cache.get('active', () => this.getActivePing().then(status => {
            if (this.device.config.debug) { console.log('active-ping', status); }

            if (status && this.device.storage.powerstate !== false) {
                return this.cache.get('active-http', () => this.getActiveHttp(), 2500).then(status => {
                    if (this.device.config.debug) { console.log('active-http', status); }
                    return status;
                });
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
     * Turn the TV On
     * @return {Promise}
     */
    async setActiveOn() {
        // If TV is in Sleep mode just send command
        if (await this.getActivePing()) {
            await this.click('KEY_POWER');

            return Promise.resolve();
        }

        // If TV is off, send WoL request
        return new Promise((resolve, reject) => wol(this.device.config.mac, this.device.config.wol)
            .then(() => resolve())
            .catch(() => reject(new WoLFailedError()))
        );
    }

    /**
     * Turn the TV Off
     * @return {Promise}
     */
    setActiveOff() {
        return this.click('KEY_POWER');
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