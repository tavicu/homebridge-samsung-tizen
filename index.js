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
            method   : config.method || 'wss',
            refresh  : config.refresh,
            timeout  : config.timeout
        };

        if (this.api) {
            this.api.on('didFinishLaunching', this.init.bind(this));
        }

        Homebridge.platform = this;
    }

    async init() {
        await this.storage.init();

        for (let device of this.config.devices) {
            device = new Device(device, Homebridge);

            for (let index in device.accessories) {
                let accessory = device.accessories[index];

                if (accessory.type == 'television') {
                    this.api.publishExternalAccessories(PLUGIN_NAME, [accessory.platformAccessory]);
                }

                if (accessory.type == 'switch' && !this.cachedAccessories.find(cachedAccessory => cachedAccessory.UUID == accessory.UUID)) {
                    this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory.platformAccessory]);
                }
            }
        }

        for (let cachedAccessory of this.cachedAccessories) {
            if (cachedAccessory.reachable !== true) {
                this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [cachedAccessory]);
            }
        }
    }

    configureAccessory(accessory) {
        if (this.cachedAccessories) {
            this.cachedAccessories.push(accessory);
        }
    }
}