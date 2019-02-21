module.exports = class Inputs {
    constructor(accessory) {
        this.hap    = accessory.hap;
        this.device = accessory.device;
        this.inputs = accessory.config.inputs;

        this.services = {};

        this.createServices();
    }

    getServices() {
        return Object.values(this.services);
    }

    createServices() {
        for (let index in this.inputs) {
            let identifier = parseInt(index) + 1;

            this.inputs[index].identifier = identifier;

            this.services[identifier] = new this.hap.Service.InputSource(this.inputs[index].name, 'input_' + identifier)
                .setCharacteristic(this.hap.Characteristic.Identifier, identifier)
                .setCharacteristic(this.hap.Characteristic.ConfiguredName, this.inputs[index].name)
                .setCharacteristic(this.hap.Characteristic.IsConfigured, this.hap.Characteristic.IsConfigured.CONFIGURED)
                .setCharacteristic(this.hap.Characteristic.InputSourceType, this.hap.Characteristic.InputSourceType.APPLICATION)
                .setCharacteristic(this.hap.Characteristic.CurrentVisibilityState, this.hap.Characteristic.CurrentVisibilityState.SHOWN);
        }
    }

    async getInput() {
        let isActive = await this.device.remote.getActive();

        if (!isActive) { return; }

        for (let input of this.inputs) {
            if (input.type != 'app') { continue; }

            let application = await this.device.remote.getApplication(input.value);

            if (application.visible) {
                return input.identifier;
            }
        }
    }

    async setInput(value) {
        let isActive = await this.device.remote.getActive();

        if (!isActive) {
            await this.device.remote.setActive(true);
            this.device.mainAccessory.updateValue(true);

            await new Promise(resolve => setTimeout(resolve, 1500));
        }

        let input = this.inputs.find(input => input.identifier == value);

        if (input.type == 'app') {
            await this.device.remote.openApplication(input.value);
        } else if (input.type == 'command') {
            await this.device.remote.command(input.value);
        } else {
            throw new Error('Command not valid');
        }
    }
}