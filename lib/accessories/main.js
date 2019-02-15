let SpeakerService     = require('../services/speaker');
let TelevisionService  = require('../services/television');
let InformationService = require('../services/information');

module.exports = class Main {
    constructor(device) {
        this.hap      = device.hap;
        this.device   = device;
        this.remote   = device.remote;
        this.name     = device.config.name;

        this.services = {};
    }

    getServices() {
        this.createMainService();
        this.createSpeakerService();
        this.createInformationService();

        return Object.values(this.services).map(value => value.service);
    }

    createMainService() {
        this.services.main = new TelevisionService(this);
    }

    createSpeakerService() {
        this.services.speaker = new SpeakerService(this);

        this.services.main.addLinkedService(this.services.speaker.service);
    }

    createInformationService() {
        this.services.information = new InformationService(this);
    }

    updateValue(value) {
        this.services.main.characteristic.updateValue(value);
    }
}