let Homebridge;
let Device  = require('./lib/device');
let Storage = require('./lib/storage');

const PLUGIN_NAME   = 'homebridge-samsung-tizen';
const PLATFORM_NAME = 'SamsungTizen';

module.exports = (homebridge) => {
    Homebridge = homebridge;
    Homebridge.registerPlatform(PLUGIN_NAME, PLATFORM_NAME, SamsungPlatform);
}

class SamsungPlatform {
    constructor(log, config, api) {
        if (!config) { return; }

        this.log     = log;
        this.api     = api;
        this.storage = new Storage(api);

        this.config = {
            delay   : config.delay,
            keys    : config.keys || {},
            inputs  : config.inputs || [],
            devices : config.devices || [],
            method  : config.method,
            refresh : config.refresh,
            timeout : config.timeout
        };

        this.storage.init();
    }

    accessories(callback) {
        let accessories = [];

        for (let device of this.config.devices) {
            device = new Device(this, device, Homebridge);

            // Add the new device accessories to the list
            accessories.push(device.accessory);
        }

        // Return the accessories
        callback(accessories);
    }
}