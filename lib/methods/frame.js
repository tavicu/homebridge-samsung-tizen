let WebSocketSecure = require('./wss');

module.exports = class Frame extends WebSocketSecure {
    constructor(device) {
        super(device);
    }
}