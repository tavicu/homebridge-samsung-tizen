let SwitchService      = require('../services/switch');
let InformationService = require('../services/information');

module.exports = class Switch {
    constructor(device, homebridge, config) {
        // Check if we have device info
        if (!config.name) throw new Error(`Switch name is required for ${device.config.name}`);

        this.device   = device;
        this.config   = config;
        this.hap      = homebridge.hap;
        this.UUID     = homebridge.hap.uuid.generate(device.config.mac + device.config.uuid + config.identifier + config.name)
        this.services = {};
        this.type = 'switch';

        this.platformAccessory = device.platform.cachedAccessories.find(cachedAccessory => cachedAccessory.UUID == this.UUID) || new homebridge.platformAccessory(config.name, this.UUID);
        this.platformAccessory.reachable = true;

        this.createServices();
    }

    createServices() {
        // Services
        this.services.main        = new SwitchService(this);
        this.services.information = new InformationService(this);

        // Add linked services
        this.getServices().forEach(service => {
            try {
                this.platformAccessory.addService(service);
            } catch(error) { }
        });
    }

    getServices() {
        return Object.values(this.services).map(type => type.service);
    }
}