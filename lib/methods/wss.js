let WebSocket = require('./ws');

const {
    PairFailedError
} = require('../errors');

module.exports = class WebSocketSecure extends WebSocket {
    constructor(device) {
        super(device);

        this.port   = device.config.port || 8002;
        this.remote = `wss://${this.ip}:${this.port}/api/v2/channels/samsung.remote.control?name=${this._encodeName()}`;
    }

    async pair() {
        if (this._getToken()) {
            return Promise.resolve();
        }

        this._closeSocket();

        try {
            await this._delay(1000);
            await super._openSocket();
        } catch(error) {
            this.device.debug(error.message);

            throw new PairFailedError();
        }
    }

    _getToken() {
        return this.token || this.platform.storage.getValue(this.device.uuid, 'token');
    }

    _openSocket() {
        return super._openSocket(`${this.remote}&token=${this._getToken()}`);
    }
}