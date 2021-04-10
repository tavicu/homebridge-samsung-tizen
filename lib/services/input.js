let delay = require('delay');

let Hap;

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
        if (this.config.type == 'art') {
            await delay(150);
            return this.device.remote.getArtMode();
        }
        else if (this.config.type == 'app') {
            let application = await this.device.remote.getApplication(this.config.value);
            return application.visible;
        }

        return false;
    }

    async setInput() {
        switch(this.config.type) {
            case 'art':
                await this.device.remote.setArtMode(true);
                break;

            case 'app':
                await this.device.remote.openApplication(this.config.value);
                break;

            case 'command':
                await this.device.remote.command(this.config.value);
                break;
        }

        return this;
    }
}