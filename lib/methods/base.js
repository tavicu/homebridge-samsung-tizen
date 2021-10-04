let delay           = require('delay');
let wol             = require('wakeonlan');
let fetch           = require('node-fetch');
let timeoutSignal   = require('timeout-signal');
let isPortReachable = require('is-port-reachable');

const {
    WoLFailedError
} = require('../errors');

module.exports = class Base {
    constructor(device) {
        this.ip      = device.config.ip;
        this.mac     = device.config.mac;
        this.name    = device.config.name    || 'SamsungTvRemote';
        this.timeout = device.config.timeout || 250;

        this.device  = device;
        this.cache   = device.cache;
    }

    destroy() {
        this.destroyed = true;
    }

    pair() {
        return delay(500);
    }

    /**
     * Get state of TV with cache
     * @return {Cache}
     */
    getState() {
        return this.cache.get('state', () => this.getStatePing().then(status => {
            if (status && this.device.storage.powerstate !== false) {
                return this.cache.get('state-http', () => this.getStateHttp(), 2500);
            } else {
                this.cache.forget('state-http');
            }

            return status;
        }), 400);
    }

    /**
     * Get state of TV by sending a Ping
     * @return {Promise}
     */
    getStatePing() {
        return isPortReachable(8001, {
            host: this.ip,
            timeout: this.timeout
        });
    }

    /**
     * Get state of TV from PowerState response
     * @return {Promise}
     */
    getStateHttp() {
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
    async setStateOn() {
        // If TV is in Sleep mode just send command
        if (await this.getStatePing()) {
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
    setStateOff() {
        return this.click('KEY_POWER');
    }

    /**
     * Get TV informations
     * @return {Promise}
     */
    getInfo() {
        return fetch(`http://${this.ip}:8001/api/v2/`, {
            signal: timeoutSignal(this.timeout < 500 ? 500 : this.timeout)
        })
        .then(body => body.json())
        .then(data => this.device.emit('api.getInfo', data) && data);
    }

    /**
     * Get Application Informations
     * @param  {Number} appId
     * @return {Promise}
     */
    getApplication(appId) {
        return fetch(`http://${this.ip}:8001/api/v2/applications/${appId}`, {
            signal: timeoutSignal(this.timeout)
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
            signal: timeoutSignal(this.timeout)
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
}