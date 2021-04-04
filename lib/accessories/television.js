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

        this.platformAccessory = new Homebridge.platformAccessory(this.device.config.name, this.UUID, Homebridge.hap.Accessory.Categories.TELEVISION);
        this.platformAccessory.reachable = true;

        this.createInputs();
        this.createServices();

        this.device.on('accessory.init', this.addAccessory.bind(this));
        this.device.on('state.change', () => this.services.main && this.services.main.getValue());
    }

    createInputs() {
        // Get config inputs
        let inputs = this.device.config.inputs;

        // Art mode input
        if (this.device.remote.art && this.device.hasOption('Frame.ModeOn.Enable')) {
            // Add input
            inputs.unshift({name: 'Art Mode', type: 'art'});

            // Refresh inputs when art mode change
            this.device.on('artmode.change', () => this.services.main && this.services.main.getValue(Homebridge.hap.Characteristic.ActiveIdentifier));
        }

        // Add blank input
        if (inputs.length && !this.device.hasOption('InputDefault.Disable')) {
            inputs.unshift({name: 'Default', type: 'default'});
        }

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