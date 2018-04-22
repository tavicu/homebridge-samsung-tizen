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

        // Change the log function to use device prefix
        this.log = function(message) {
            log.prefix = config['name'];
            log.log(null, message);
        };

        // Check if we have device info
        if (!config.ip) throw new Error(`TV IP address is required for ${config['name']}`);
        if (!config.mac) throw new Error(`TV MAC address is required for ${config['name']}`);

        // Create the remote for the device
        this.remote = new SamsungRemote(this.config);

        // Create accessories for device
        this.initAccessories();
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
                this.accessories.push(new SamsungAccessory({...this, config: {...this.config, ...element}}));
            }
        }
    }
}