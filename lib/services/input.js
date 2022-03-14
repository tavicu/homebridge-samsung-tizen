let Hap;
let utils = require('../utils');

module.exports = class Input {
    constructor(config, accessory, homebridge) {
        Hap = homebridge.hap;

        this.config = config;
        this.device = accessory.device;
        this.stateless = ['input', 'app', 'art'].indexOf(this.config.type) === -1;

        this.createService();
    }

    createService() {
        this.service = new Hap.Service.InputSource(this.config.name, `input_${this.config.identifier}`)
            .setCharacteristic(Hap.Characteristic.Identifier, this.config.identifier)
            .setCharacteristic(Hap.Characteristic.ConfiguredName, this.config.name)
            .setCharacteristic(Hap.Characteristic.IsConfigured, Hap.Characteristic.IsConfigured.CONFIGURED)
            .setCharacteristic(Hap.Characteristic.InputSourceType, this.getSourceType())
            .setCharacteristic(Hap.Characteristic.TargetVisibilityState, Hap.Characteristic.TargetVisibilityState.SHOWN)
            .setCharacteristic(Hap.Characteristic.CurrentVisibilityState, Hap.Characteristic.CurrentVisibilityState.SHOWN);

        this.service.linked = true;
    }

    getSourceType() {
        if (typeof this.config.value != 'string') {
            return Hap.Characteristic.InputSourceType.OTHER;
        }

        if (this.config.type == 'app') {
            return Hap.Characteristic.InputSourceType.APPLICATION;
        }

        if (this.config.value == 'digitalTv') {
            return Hap.Characteristic.InputSourceType.TUNER;
        }

        if (this.config.value == 'USB') {
            return Hap.Characteristic.InputSourceType.USB;
        }

        if (this.config.value && this.config.value.startsWith('HDMI')) {
            return Hap.Characteristic.InputSourceType.HDMI;
        }

        return Hap.Characteristic.InputSourceType.OTHER;
    }

    async getInput() {
        if (this.config.type == 'art') {
            await utils.delay(150);
            return this.device.remote.getArtMode();
        }
        else if (this.config.type == 'app') {
            let application = await this.device.remote.getApplication(this.config.value);
            return application.visible;
        }
        else if (this.config.type == 'input') {
            let input = await this.device.remote.getInputSource();
            return input.value == this.config.value;
        }

        return false;
    }

    async setInput() {
        await utils.race(this.runInput());

        return this;
    }

    async runInput() {
        switch(this.config.type) {
            case 'art':
                await this.device.remote.setArtMode(true);
                break;

            case 'app':
                await this.device.remote.setApplication(this.config.value);
                break;

            case 'input':
                await this.device.remote.setInputSource(this.config.value);
                break;

            case 'command':
                await this.device.remote.command(this.config.value);
                break;
        }
    }
}