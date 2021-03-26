let SwitchService      = require('../services/switch');
let InformationService = require('../services/information');

let Homebridge, Platform;

module.exports = class Switch {
    constructor(config, device, platform, homebridge) {
        Platform   = platform;
        Homebridge = homebridge;

        // Check if we have device info
        if (!config.name) throw new Error(`Switch name is required for ${device.config.name}`);

        this.device   = device;
        this.config   = config;
        this.type     = 'switch';
        this.UUID     = Homebridge.hap.uuid.generate(this.device.UUID + this.config.identifier + this.config.name);

        this.services = {};

        this.platformAccessory = new Homebridge.platformAccessory(`${this.device.config.name} ${this.config.name}`, this.UUID);
        this.platformAccessory.reachable = true;

        this.device.on('init', () => this.createServices());
    }

    createServices() {
        // Services
        this.services.main        = new SwitchService(this, Homebridge);
        this.services.information = new InformationService(this, Homebridge);

        // Add services
        this.getServices().forEach(service => {
            try {
                this.platformAccessory.addService(service);
            } catch(error) { }
        });

        // Emit event
        this.device.emit('accessory.init', this);
    }

    getServices() {
        return Object.values(this.services).map(type => type.services || type.service).flat();
    }
}
