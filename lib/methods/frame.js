let WebSocketSecure = require('./wss');

module.exports = class Frame extends WebSocketSecure {
    constructor(device) {
        super(device);
    }

    /**
     * Turn the TV Off
     * @return {Promise}
     */
    setActiveOff() {
        return this.holdKey('KEY_POWER', 3000);
    }
}