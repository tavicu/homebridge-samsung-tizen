module.exports = class Cache {
    constructor(device) {
        this.keys = {};

        device.on('artmode.update', () => this.flush());
    }

    /**
     * Get from cache or run the function
     * @param  {string} key
     * @param  {Promise} run
     * @param  {Number} time
     * @return {Promise}
     */
    get(key, run = Promise.resolve(), time = 500) {
        if (this.keys[key] && Date.now() < this.keys[key].expire) {
            return Promise.resolve(this.keys[key].value);
        }

        // If we already have one caching
        // in progress try again in 100 ms
        if (this.keys[key] && this.keys[key].fetching) {
            return new Promise(resolve => setTimeout(() => resolve(this.get(key, run, time)), 100));
        }

        this.keys[key] = {
            fetching: true
        };

        return run().then(value => {
            this.keys[key] = {
                value: value,
                expire: Date.now() + time
            };

            return value;
        });
    }

    /**
     * Remove a key from cache
     * @param  {string} key
     * @return {Cache}
     */
    forget(key) {
        delete this.keys[key];
        return this;
    }

    /**
     * Remove all keys from cache
     * @return {Cache}
     */
    flush() {
        this.keys = {};
        return this;
    }
}