let Hap;
let Device = require('./lib/device');
let Storage  = require('./lib/storage');

module.exports = (homebridge) => {
    Hap = homebridge.hap;

    homebridge.registerPlatform('homebridge-samsung-tizen', 'SamsungTizen', SamsungPlatform);
}

class SamsungPlatform {
    constructor(log, config, api) {
        this.log = log;
        this.api = api;

        this.storage = new Storage(api);
        this.devices = config['devices'] || [];

        this.config = {
            delay   : config.delay,
            inputs  : config.inputs || [],
            method  : config.method,
            refresh : config.refresh,
            timeout : config.timeout
        }

        this.storage.init();
    }

    accessories(callback) {
        let accessories = [];

        for (let device of this.devices) {
            device = new Device(this, Hap, device);

            // Add the new device accessories to the list
            accessories = [
                ...accessories,
                ...device.accessories
            ];
        }

        // Return the accessories
        callback(accessories);
    }
}