let Homebridge;
let Device  = require('./lib/device');
let Storage = require('./lib/storage');

const PLUGIN_NAME   = 'homebridge-samsung-tizen';
const PLATFORM_NAME = 'SamsungTizen';

module.exports = (homebridge) => {
    Homebridge = homebridge;
    Homebridge.registerPlatform(PLUGIN_NAME, PLATFORM_NAME, SamsungPlatform, true);
}

class SamsungPlatform {
    constructor(log, config, api) {
        if (!config) { return; }

        this.log     = log;
        this.api     = api;
        this.storage = new Storage(api);

        this.cachedAccessories = [];

        this.config = {
            delay    : config.delay,
            keys     : config.keys || {},
            inputs   : config.inputs || [],
            devices  : config.devices || [],
            switches : config.switches || [],
            method   : config.method,
            refresh  : config.refresh,
            timeout  : config.timeout,
            api_key  : config.api_key || null
        };

        if (this.api) {
            this.api.on('didFinishLaunching', this.init.bind(this));
        }
    }

    async init() {
        await this.storage.init();

        for (let device of this.config.devices) {
            try {
                let mainAccessory = null;

                device = new Device(device, this, Homebridge);

                for (let index in device.accessories) {
                    let accessory = device.accessories[index];

                    if (accessory.type == 'television') {
                        mainAccessory = accessory;
                    }
                    else if (mainAccessory) {
                        mainAccessory.addAccessory(accessory);
                    }
                }

                this.api.publishExternalAccessories(PLUGIN_NAME, [mainAccessory.platformAccessory]);
            } catch(error) {
                this.log.error(error.message);
                this.log.debug(error.stack);
            }
        }

        for (let cachedAccessory of this.cachedAccessories) {
            this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [cachedAccessory]);
        }
    }

    configureAccessory(accessory) {
        this.cachedAccessories.push(accessory);
    }
}