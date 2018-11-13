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
    pairDevice() {
        // Stop if it's already paired
        if (this.config.token) { return; }

        // With delay
        setTimeout(() => {
            this.remote._pair().then(token => {
                this.log(`SAVE THE TOKEN! Update config to use {'token': '${token}'}!`);
            }, error => {
                this.log(`Pair failed. Please make sure your TV is ON then restart Homebridge!`);
            });
        }, 4000);
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