let Hap;

const { InvalidInputTypeError } = require('../errors');

module.exports = class Input {
    constructor(config, accessory, homebridge) {
        Hap = homebridge.hap;

        this.config = config;
        this.device = accessory.device;

        this.createService();
    }

    createService() {
        this.service = new Hap.Service.InputSource(this.config.name, `input_${this.config.identifier}`)
            .setCharacteristic(Hap.Characteristic.Identifier, this.config.identifier)
            .setCharacteristic(Hap.Characteristic.ConfiguredName, this.config.name)
            .setCharacteristic(Hap.Characteristic.IsConfigured, Hap.Characteristic.IsConfigured.CONFIGURED)
            .setCharacteristic(Hap.Characteristic.InputSourceType, Hap.Characteristic.InputSourceType[this.config.type == 'app' ? 'APPLICATION' : 'OTHER'])
            .setCharacteristic(Hap.Characteristic.TargetVisibilityState, Hap.Characteristic.TargetVisibilityState.SHOWN)
            .setCharacteristic(Hap.Characteristic.CurrentVisibilityState, Hap.Characteristic.CurrentVisibilityState.SHOWN);

        this.service.linked = true;
    }

    async getInput() {
        if (this.config.type != 'app') {
            return false;
        }

        let application = await this.device.remote.getApplication(this.config.value);

        return application.visible;
    }

    async setInput() {
        if (this.config.type == 'app') {
            await this.device.remote.openApplication(this.config.value);
        } else if (this.config.type == 'command') {
            await this.device.remote.command(this.config.value);
        } else {
            throw new InvalidInputTypeError();
        }

        return this;
    }
}