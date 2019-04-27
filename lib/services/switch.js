module.exports = class Switch {
    constructor(accessory, config) {
        this.config = config;
        this.hap    = accessory.hap;
        this.device = accessory.device;

        this.options   = require('../options/switch')(this, accessory);
        this.stateless = this.options.every(option => option.stateless);

        this.createService();
    }

    createService() {
        this.service = new this.hap.Service.Switch(`${this.config.name} ${this.device.config.name}`, `switch_${this.config.identifier}`);

        this.service.getCharacteristic(this.hap.Characteristic.On)
            .on('get', this.getSwitch.bind(this))
            .on('set', this.setSwitch.bind(this));
    }

    getValue() {
        if (this.stateless) {
            return;
        }

        this.service.getCharacteristic(this.hap.Characteristic.On).getValue();
    }

    async getSwitch(callback) {
        for (let index in this.options) {
            let option = this.options[index];

            if (option.stateless) {
                continue;
            }

            if (await option.get(option)) {
                return callback(null, true);
            }
        }

        callback(null, false);
    }

    async setSwitch(value, callback) {
        try {
            for (let index in this.options) {
                let option = this.options[index];

                if (!value && option.stateless) {
                    continue;
                }

                await option.set(value, option);

                if (this.options.length > 1 && index < this.options.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, value ? 400 : 50));
                }
            }

            if (value && this.stateless) {
                setTimeout(() => this.updateValue(false), 100);
            }

            callback();
        }
        catch (error) {
            this.device.error(error.message);
            this.device.debug(error.stack);

            callback(error);
        }
    }
}