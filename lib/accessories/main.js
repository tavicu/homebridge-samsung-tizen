let InputsService      = require('../services/inputs');
let SpeakerService     = require('../services/speaker');
let TelevisionService  = require('../services/television');
let InformationService = require('../services/information');

module.exports = class Main {
    constructor(device) {
        this.hap       = device.hap;
        this.device    = device;
        this.config    = device.config;
        this.name      = device.config.name;
        this.stateless = false;

        this.services  = {};
    }

    getValue() {
        Object.values(this.services).forEach(service => {
            if (typeof service.getValue === 'function') {
                service.getValue();
            }
        });
    }

    updateValue(value, characteristic) {
        this.services.main.updateValue(value, characteristic);
    }

    getServices() {
        this.createMainService();
        this.createInputsService();
        this.createSpeakerService();
        this.createInformationService();

        return Object.values(this.services).map(value => value.getServices()).reduce((acc, val) => acc.concat(val), []);
    }

    createMainService() {
        this.services.main = new TelevisionService(this);
    }

    createInputsService() {
        this.services.inputs = new InputsService(this);

        for (let service of this.services.inputs.getServices()) {
            this.services.main.addLinkedService(service);
        }
    }

    createSpeakerService() {
        this.services.speaker = new SpeakerService(this);

        this.services.main.addLinkedService(this.services.speaker.service);
    }

    createInformationService() {
        this.services.information = new InformationService(this);
    }
}