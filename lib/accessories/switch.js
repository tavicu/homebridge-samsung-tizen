let SwitchService      = require('../services/switch');
let InformationService = require('../services/information');

module.exports = class Switch {
    constructor(device) {
        this.hap       = device.hap;
        this.device    = device;
        this.remote    = device.remote;
        this.name      = device.config.name;

        this.services  = {};
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

    updateValue(value) {
        this.services.main.characteristic.updateValue(value);
    }
}