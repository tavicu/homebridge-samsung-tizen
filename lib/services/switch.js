let Hap;
let utils = require('../utils');

const { TvOfflineError } = require('../errors');

module.exports = class Switch {
    constructor(accessory, homebridge) {
        Hap = homebridge.hap;

        this.device    = accessory.device;
        this.accessory = accessory;
        this.service   = this.accessory.platformAccessory.getService(Hap.Service.Switch);
        this.options   = require('../options/switch')(this, this.accessory);
        this.stateless = this.options.every(option => !option.offable);

        this.createService();
    }

    createService() {
        this.service = this.service || new Hap.Service.Switch(`${this.device.config.name} ${this.accessory.config.name}`, `switch_${this.accessory.config.identifier}`);

        this.service.getCharacteristic(Hap.Characteristic.On)
            .on('get', this.getSwitch.bind(this))
            .on('set', this.setSwitch.bind(this));
    }

    getValue() {
        if (this.stateless) {
            return;
        }

        this.service.getCharacteristic(Hap.Characteristic.On).getValue();
    }

    updateValue(value) {
        this.service.getCharacteristic(Hap.Characteristic.On).updateValue(value);
    }

    async getSwitch(callback) {
        let value = false;

        for (let index in this.options) {
            let option = this.options[index];

            if (!option.get) {
                continue;
            }

            if (await option.get(option)) {
                value = true;
            } else {
                value = false;
                break;
            }
        }

        callback(null, value);
    }

    async setSwitch(value, callback) {
        utils.race(this.runSwitch(value))
        .then(() => callback())
        .catch(error => {
            this.device.log.error(error.message);
            this.device.log.debug(error.stack);

            if (error instanceof TvOfflineError) {
                setTimeout(() => this.updateValue(false), 100);
                callback();
            } else {
                callback(error);
            }
        });
    }

    async runSwitch(value) {
        for (let index in this.options) {
            let option = this.options[index];

            if (!value && !option.offable) {
                continue;
            }

            await option.set(value, option);

            if (this.options.length > 1 && index < this.options.length - 1) {
                await utils.delay(value ? 300 : 50);
            }
        }

        if (value && this.stateless) {
            setTimeout(() => this.updateValue(false), 100);
        }
    }
}