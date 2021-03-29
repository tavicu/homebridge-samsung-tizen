let FrameService       = require('../services/frame');
let InformationService = require('../services/information');

let Homebridge, Platform;

module.exports = class Frame {
    constructor(device, platform, homebridge) {
        Platform   = platform;
        Homebridge = homebridge;

        this.device   = device;
        this.type     = 'frame';
        this.UUID     = Homebridge.hap.uuid.generate(this.device.UUID + 'Frame');

        this.services = {};

        this.platformAccessory = new Homebridge.platformAccessory(`${this.device.config.name} Frame`, this.UUID);
        this.platformAccessory.reachable = true;

        if (this.device.remote.art) {
            this.createServices();
        }

        this.device.on('state.change', () => this.services.main.getValue());
        this.device.on('artmode.init', () => this.createServices());
    }

    createServices() {
        // Stop if services are already created
        if (Object.keys(this.services).length) { return; }

        // Services
        this.services.main        = new FrameService(this, Homebridge);
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
