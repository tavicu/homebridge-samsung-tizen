let WebSocketSecure = require('./wss');

module.exports = class Frame extends WebSocketSecure {
    constructor(device, art) {
        super(device);

        this.art = art;
    }

    /**
     * Get status of TV with cache
     * @param  {Object} options
     * @return {Cache}
     */
    getActive(options = {}) {
        return super.getActive().then(status => {
            if (status && options.power !== true) {
                // Get the Art Mode status and return the negated value
                return this.art.getStatus().then(status => !status);
            }

            return status;
        });
    }

    /**
     * Turn the TV On and turn off the Art Mode
     * @param  {Object} options
     * @return {Promise}
     */
    async setActiveOn(options = {}) {
        await super.setActiveOn();

        this.art.setStatus(false).catch(() => {});
    }

    /**
     * Turn the TV Off
     * @param  {Object} options
     * @return {Promise}
     */
    setActiveOff(options = {}) {
        let _do = () => options.power === true ? this.hold('KEY_POWER', 3500) : this.click('KEY_POWER');

        if (options.wait === false) {
            return _do() && Promise.resolve();
        }

        return _do();
    }

    async getArtStatus() {
        if (!await super.getActive()) {
            return false;
        }

        return this.art.getStatus();
    }

    async setArtStatus(value) {
        let _do = () => this.art.setStatus(value);

        if (!await super.getActive()) {
            await super.setActiveOn();

            return _do() && Promise.resolve();
        }

        return _do();
    }
}