let WebSocket = require('./ws');

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

        await this._delay(1000);

        await super._openSocket();
    }

    _getToken() {
        return this.token || this.storage.get(this.device.uuid);
    }

    _openSocket() {
        return super._openSocket(`${this.remote}&token=${this._getToken()}`);
    }
}