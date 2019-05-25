let InputService       = require('./services/input');
let SwitchService      = require('./services/switch');
let SpeakerService     = require('./services/speaker');
let TelevisionService  = require('./services/television');
let InformationService = require('./services/information');

// let PlatformAccessory  = require('homebridge/lib/platformAccessory.js');

module.exports = class Accessory {
    constructor(device, homebridge) {
        this.device = device;
        this.hap    = homebridge.hap;

        this.inputs   = [];
        this.switches = [];
        this.services = {};

        this.platformAccessory = new homebridge.platformAccessory(device.config.name, device.uuid, homebridge.hap.Accessory.Categories.TELEVISION);

        this.createServices();
    }

    createServices() {
        // Remove existing services
        this.platformAccessory.services.forEach(service => this.platformAccessory.removeService(service));

        // Main
        this.services.main        = new TelevisionService(this);
        this.services.speaker     = new SpeakerService(this);
        this.services.information = new InformationService(this);

        // Inputs
        this.device.config.inputs.forEach((element, index) => this.inputs.push(new InputService(this, {
            ...element,
            identifier: parseInt(index) + 1
        })));

        // Switches
        this.device.config.switches.forEach((element, index) => this.switches.push(new SwitchService(this, {
            ...element,
            identifier: parseInt(index) + 1
        })));

        // Add linked services
        this.getServices().forEach(service => {
            this.platformAccessory.addService(service);

            if (service.linked) {
                this.services.main.addLinkedService(service);
            }
        });
    }

    getServices() {
        return [
            ...Object.values(this.services).map(type => type.service),
            ...Object.values(this.inputs).map(type => type.service),
            ...Object.values(this.switches).map(type => type.service)
        ];
    }
}