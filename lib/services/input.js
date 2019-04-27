const { InvalidInputTypeError } = require('../errors');

module.exports = class Input {
    constructor(accessory, config) {
        this.config = config;
        this.hap    = accessory.hap;
        this.device = accessory.device;

        this.createService();
    }

    createService() {
        this.service = new this.hap.Service.InputSource(this.config.name, `input_${this.config.identifier}`)
            .setCharacteristic(this.hap.Characteristic.Identifier, this.config.identifier)
            .setCharacteristic(this.hap.Characteristic.ConfiguredName, this.config.name)
            .setCharacteristic(this.hap.Characteristic.IsConfigured, this.hap.Characteristic.IsConfigured.CONFIGURED)
            .setCharacteristic(this.hap.Characteristic.InputSourceType, this.hap.Characteristic.InputSourceType[this.config.type == 'app' ? 'APPLICATION' : 'OTHER'])
            .setCharacteristic(this.hap.Characteristic.TargetVisibilityState, this.hap.Characteristic.TargetVisibilityState.SHOWN)
            .setCharacteristic(this.hap.Characteristic.CurrentVisibilityState, this.hap.Characteristic.CurrentVisibilityState.SHOWN);

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