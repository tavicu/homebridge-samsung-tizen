let SwitchService      = require('../services/switch');
let InformationService = require('../services/information');

module.exports = class Switch {
    constructor(device) {
        this.hap       = device.hap;
        this.device    = device;
        this.config    = device.config;
        this.name      = device.config.name;

        this.options   = require('../data/switchOptions')(this);
        this.stateless = this.options.every(option => option.stateless);

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
        this.createInformationService();

        return Object.values(this.services).map(value => value.getServices()).reduce((acc, val) => acc.concat(val), []);
    }

    createMainService() {
        this.services.main = new SwitchService(this);
    }

    createInformationService() {
        this.services.information = new InformationService(this);
    }
}