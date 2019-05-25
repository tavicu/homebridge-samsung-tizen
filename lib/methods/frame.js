let WebSocketSecure = require('./wss');

module.exports = class FrameMethod extends WebSocketSecure {
    constructor(device) {
        super(device);

        this.port   = device.config.port || 8002;
        this.remote = `wss://${this.ip}:${this.port}/api/v2/channels/samsung.remote.control?name=${this._encodeName()}`;
    }
}