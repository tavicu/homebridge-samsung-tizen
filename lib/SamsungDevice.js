let SamsungRemote    = require('./SamsungRemote');
let SamsungAccessory = require('./SamsungAccessory');

module.exports = class SamsungDevice {
    /**
     * Constructor
     *
     * @param  {Function} log
     * @param  {Object}   hap
     * @param  {Object}   config
     */
    constructor(log, hap, config) {
        this.hap         = hap;
        this.config      = config;
        this.pairRetries = 3;
        this.accessories = [];

        // Change log prefix
        log.prefix = config['name'];

        // Change the log function to use device prefix
        this.log   = function(message) { log.log(null, message) }
        this.debug = function(message) { log.debug('[DEBUG]', message) }

        // Check if we have device info
        if (!config.ip) throw new Error(`TV IP address is required for ${config['name']}`);
        if (!config.mac) throw new Error(`TV MAC address is required for ${config['name']}`);

        // Create the remote for the device
        this.remote = new SamsungRemote(this);

        // Pair device
        this.pairDevice();

        // Create accessories for device
        this.initAccessories();
    }

    /**
     * Start pair procedure for device
     */
    async pairDevice(delay = 5000) {
        // Stop if it's already paired
        if (this.config.token) { return; }

        // Check if TV is ON
        if (!await this.remote.isOn(true)) {
            return this.log('Please turn ON the TV for pairing.');
        }

        // Try pairing with delay
        setTimeout(() => {
            this.remote.pair(delay).then(token => {
                this.log(`Pair success. SAVE THE TOKEN! Update config file to use {'token': '${token}'}`);
            }, error => {
                // Retry pairing
                if (this.pairRetries > 1) {
                    // Try to pair again in 1 second
                    this.pairDevice(1000);

                    // Decrement retries
                    this.pairRetries--;

                } else {
                    // Pair failed
                    this.log(`Pair failed. Make sure you click Allow on the TV!`);
                }
            });
        }, delay);
    }

    /**
     * Create the accessories for this device
     *
     * @return {Array}
     */
    initAccessories() {
        this.accessories = [];

        // Create the ON / OFF accessory
        this.accessories.push(new SamsungAccessory(this));

        // If we have custom switches create them
        if (Array.isArray(this.config['switches'])) {
            for (let element of this.config['switches']) {
                // Append switch with device name
                element.name = `${element.name} ${this.config['name']}`;

                // Create and add the new accessory
                this.accessories.push(new SamsungAccessory({...this, config: {...this.config, ...element}}, 'switch'));
            }
        }
    }
}