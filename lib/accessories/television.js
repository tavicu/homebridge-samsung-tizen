let InputService       = require('../services/input');
let SpeakerService     = require('../services/speaker');
let TelevisionService  = require('../services/television');
let InformationService = require('../services/information');

let Homebridge, Platform;

module.exports = class Television {
    constructor(device, platform, homebridge) {
        Platform   = platform;
        Homebridge = homebridge;

        this.device = device;
        this.type   = 'television';
        this.UUID   = device.UUID;

        this.inputs   = [];
        this.services = {};

        this.platformAccessory = new Homebridge.platformAccessory(this.device.config.name, this.UUID, Homebridge.hap.Categories.TELEVISION);
        this.platformAccessory.reachable = true;

        this.createInputs();
        this.createServices();

        this.device.on('accessory.init', this.addAccessory.bind(this));
    }

    createInputs() {
        // Get config inputs
        let inputs = this.device.config.inputs || [];

        // Create inputs
        inputs.forEach(element => this.inputs.push(new InputService({
            ...element,
            identifier: this.inputs.length + 1
        }, this, Homebridge)));
    }

    createServices() {
        // Services
        this.services.main        = new TelevisionService(this, Homebridge);
        this.services.speaker     = new SpeakerService(this, Homebridge);
        this.services.information = new InformationService(this, Homebridge);

        // Add linked services
        this.getServices().forEach(service => {
            try {
                this.platformAccessory.addService(service);
            } catch(error) { }

            if (service.linked) {
                this.services.main.addLinkedService(service);
            }
        });
    }

    getServices() {
        return [
            ...Object.values(this.services).map(type => type.services || type.service),
            ...Object.values(this.inputs).map(type => type.services || type.service)
        ].flat();
    }

    addAccessory(accessory) {
        if (!accessory || !accessory.services || !accessory.services.main) { return; }

        (accessory.services.main.services || [accessory.services.main.service]).forEach(service => {
            if (this.platformAccessory.getServiceById(Homebridge.hap.Service.Switch, service.subtype)) { return; }

            this.platformAccessory.addService(service);
        });
    }
}
