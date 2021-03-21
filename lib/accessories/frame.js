let FrameService       = require('../services/frame');
let InformationService = require('../services/information');

let Homebridge, Platform;

module.exports = class Frame {
    constructor(device, platform, homebridge) {
        Platform   = platform;
        Homebridge = homebridge;

        this.device   = device;
        this.config   = {
            name: 'Power'
        };
        this.type     = 'frame';
        this.UUID     = Homebridge.hap.uuid.generate(this.device.UUID + this.config.name + 'Frame');

        this.services = {};

        this.platformAccessory = new Homebridge.platformAccessory(`${this.device.config.name} ${this.config.name}`, this.UUID);
        this.platformAccessory.reachable = true;

        this.createServices();
    }

    createServices() {
        // Services
        this.services.main        = new FrameService(this, Homebridge);
        this.services.information = new InformationService(this, Homebridge);

        // Add services
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
