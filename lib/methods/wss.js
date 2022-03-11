let utils     = require('../utils');

let WebSocket = require('./ws');

const {
    TvOfflineError,
    PairFailedError
} = require('../errors');

module.exports = class WebSocketSecure extends WebSocket {
    constructor(device) {
        super(device);

        this.port = device.config.port || 8002;
        this.url  = `wss://${this.ip}:${this.port}/api/v2/channels/samsung.remote.control?name=${this._encodeName()}`;
    }

    async pair() {
        if (this._getToken()) {
            return Promise.resolve();
        }

        this._close();

        try {
            await utils.delay(1000);

            if (!await this.getState()) {
                throw new TvOfflineError();
            }

            await super._open();
        } catch(error) {
            await utils.delay(3000);

            this.device.log.debug(error.message);

            throw new PairFailedError();
        }
    }

    _open() {
        return super._open(`${this.url}&token=${this._getToken()}`);
    }

    _getToken() {
        return this.token || this.device.storage.token || '';
    }
}