let Hap;
let SamsungDevice = require('./SamsungDevice');

module.exports = (homebridge) => {
    Hap = homebridge.hap;

    homebridge.registerPlatform('homebridge-samsung-tizen', 'SamsungTizen', SamsungPlatform);
}

class SamsungPlatform {
    /**
     * Constructor
     *
     * @param  {Function} log
     * @param  {Object}   config
     */
    constructor(log, config) {
        this.log     = log;
        this.refresh = config['refresh'];
        this.devices = config['devices'] || [];
    }

    /**
     * Get accessories for this platform
     *
     * @param  {Function} callback
     */
    accessories(callback) {
        let accessoryList = [];

        // Process each device
        for (let device of this.devices) {
            // Create the new device
            device = new SamsungDevice(this, Hap, device);

            // Add the new device accessories to the list
            accessoryList = [...accessoryList, ...device.accessories];
        }

        // Return the accessories
        callback(accessoryList);
    }
}