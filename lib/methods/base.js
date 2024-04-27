let utils           = require('../utils');
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

    /**
     * Cleans up resources or state.
     */
    destroy() {
        this.destroyed = true;
    }

    /**
     * Simulates a pairing delay.
     * @return {Promise<void>}
     */
    pair() {
        return utils.delay(500);
    }

    /**
     * Retrieves the TV's power state by first attempting a network ping.
     * If the ping succeeds, it validates the power state via HTTP.
     * If the ping fails, it assumes the TV is off, unless previously recorded as on.
     * @return {Promise<boolean>} Resolves with true if on, false if off.
     */
    getState() {
        return this.cache.get('state', () => this.getStatePing().then(status => {
            this.device.log.debug(`Ping status: ${status}`);
            if (status && this.device.storage.powerstate !== false) {
                this.device.log.debug('Ping succeeded, fetching power state via HTTP...');
                return this.cache.get('state-http', () => this.getStateHttp(status), 2500);
            } else {
                this.cache.forget('state-http');
            }

            return status;
        }), 400);
    }

    /**
     * Checks TV availability via network ping.
     * @return {Promise<boolean>}
     */
    getStatePing() {
        this.device.log.debug(`Pinging ${this.ip} with timeout ${this.timeout}ms.`);
        return isPortReachable(8001, {
            host: this.ip,
            timeout: this.timeout
        });
    }

    /**
     * Fetches the TV's power state via its local API.
     * @param  {boolean} fallback - Fallback value if HTTP request fails.
     * @return {Promise<boolean>}
     */
    getStateHttp(fallback = false) {
        this.device.log.debug(`Fetching power state from ${this.ip} local TV API.`);
        return this.getInfo().then(data => {
            if (data.device && data.device.PowerState) {
                this.device.log.debug(`Power state: ${data.device.PowerState}`);
                return data.device.PowerState == 'on';
            }

            return true;
        })
        .catch(() => fallback);
    }

    /**
     * Powers on the TV. Uses Wake-on-LAN if necessary.
     * @return {Promise<void>}
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
     * Powers off the TV.
     * @return {Promise<void>}
     */
    setStateOff() {
        return this.click('KEY_POWER');
    }

    /**
     * Retrieves device information from the TV's API.
     * @return {Promise<Object>}
     */
    getInfo() {
        return fetch(`http://${this.ip}:8001/api/v2/`, {
            signal: timeoutSignal(this.timeout < 500 ? 500 : this.timeout)
        })
        .then(body => body.json())
        .then(data => this.device.emit('api.getInfo', data) && data);
    }

    /**
     * Retrieves information about a specific application.
     * @param  {number} appId - The application ID.
     * @return {Promise<Object>}
     */
    getApplication(appId) {
        return fetch(`http://${this.ip}:8001/api/v2/applications/${appId}`, {
            signal: timeoutSignal(this.timeout)
        })
        .then(body => body.json());
    }

    /**
     * Launches an application on the TV.
     * @param  {number} appId - The application ID to launch.
     * @return {Promise<void>}
     */
    startApplication(appId) {
        return fetch(`http://${this.ip}:8001/api/v2/applications/${appId}`, {
            method: 'POST',
            signal: timeoutSignal(this.timeout)
        })
        .then(body => body.json());
    }

    /**
     * Encodes the TV name to base64.
     * @return {string} The encoded TV name.
     */
    _encodeName() {
        return new Buffer.from(this.name).toString('base64');
    }
}