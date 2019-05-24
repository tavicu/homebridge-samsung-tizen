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

        this.config = {
            delay    : config.delay,
            keys     : config.keys || {},
            inputs   : config.inputs || [],
            devices  : config.devices || [],
            switches : config.switches || [],
            method   : config.method,
            refresh  : config.refresh,
            timeout  : config.timeout
        };

        if (this.api) {
            this.api.on('didFinishLaunching', this.init.bind(this));
        }
    }

    async init() {
        await this.storage.init();

        for (let device of this.config.devices) {
            device = new Device(this, device, Homebridge);

            this.api.publishExternalAccessories(PLUGIN_NAME, [device.accessory.platformAccessory]);
        }
    }

    configureAccessory(accessory) {

    }
}