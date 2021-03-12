let WebSocketSecure = require('./wss');

module.exports = class Frame extends WebSocketSecure {
    constructor(device, art) {
        super(device);

        this.art = art;
    }

    /**
     * Get status of TV with cache
     * @return {Cache}
     */
    getActive() {
        return super.getActive().then(status => {
            if (status) {
                // Get the Art Mode status and return the negated value
                return this.cache.get('art-active', () => this.art.getStatus().then(status => !status), 250);
            } else {
                this.cache.forget('art-active');
            }

            return status;
        });
    }

    /**
     * Turn the TV On and turn off the Art Mode
     * @return {Promise}
     */
    async setActiveOn() {
        await super.setActiveOn();

        this.art.setStatus(false).catch(() => {});
    }
}