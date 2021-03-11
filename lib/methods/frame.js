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
}