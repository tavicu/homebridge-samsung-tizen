let SamsungRemote    = require('./SamsungRemote');
let SamsungAccessory = require('./SamsungAccessory');

module.exports = class SamsungDevice {
    /**
     * Constructor
     *
     * @param  {Function} log
     * @param  {Object}   hap
     * @param  {Object}   device
     */
    constructor(log, hap, device) {
        this.hap    = hap;
        this.device = device;

        // Change the log function to use device prefix
        this.log = function(message) {
            log.prefix = device['name'];
            log.log(null, message);
        };

        // Check if we have device info
        if (!device.ip) throw new Error(`TV IP address is required for ${device['name']}`);
        if (!device.mac) throw new Error(`TV MAC address is required for ${device['name']}`);

        // Create the remote for the device
        this.remote = new SamsungRemote(this.device);
    }

    /**
     * Create the accessories for this device
     *
     * @return {Array}
     */
    accessories() {
        let accessoryList = [];

        // Create the ON / OFF accessory
        accessoryList.push(new SamsungAccessory(this.log, this.hap, this.device, this.remote));

        // If we have custom switches create them
        if (Array.isArray(this.device['switches'])) {
            for (let element of this.device['switches']) {
                // Prepend switch with device name
                element.name = `${this.device['name']} ${element.name}`;

                // Create and add the new accessory
                accessoryList.push(new SamsungAccessory(this.log, this.hap, {...this.device, ...element}, this.remote));
            }
        }

        // Return the accessories
        return accessoryList;
    }
}