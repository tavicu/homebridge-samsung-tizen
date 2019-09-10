let InputService       = require('../services/input');
let SpeakerService     = require('../services/speaker');
let TelevisionService  = require('../services/television');
let InformationService = require('../services/information');

module.exports = class Television {
    constructor(device, homebridge) {
        this.device = device;
        this.hap    = homebridge.hap;
        this.UUID   = device.UUID;
        this.type = 'television';

        this.inputs   = [];
        this.services = {};

        this.platformAccessory = new homebridge.platformAccessory(device.config.name, this.UUID, homebridge.hap.Accessory.Categories.TELEVISION);

        this.createServices();
    }

    createServices() {
        // Services
        this.services.main        = new TelevisionService(this);
        this.services.speaker     = new SpeakerService(this);
        this.services.information = new InformationService(this);

        // Inputs
        this.device.config.inputs.forEach((element, index) => this.inputs.push(new InputService(this, {
            ...element,
            identifier: parseInt(index) + 1
        })));

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
            ...Object.values(this.services).map(type => type.service),
            ...Object.values(this.inputs).map(type => type.service)
        ];
    }
}