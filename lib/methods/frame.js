let WebSocketSecure = require('./wss');

module.exports = class Frame extends WebSocketSecure {
    constructor(device) {
        super(device);
    }

    /**
     * Turn the TV Off
     * @return {Promise}
     */
    setStateOff() {
        return this.hold('KEY_POWER', 3500) && Promise.resolve();
    }
}