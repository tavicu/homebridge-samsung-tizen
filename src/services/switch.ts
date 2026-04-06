import { HAP, CharacteristicEventTypes, CharacteristicValue, CharacteristicGetCallback } from 'homebridge';

let hap: HAP;

export class SwitchService {
    public device;
    public service;

    constructor(public accessory) {
        const { device, platform } = accessory;
        hap = platform.api.hap;

        this.device = device;
        // this.options   = require('../options/switch')(this, this.accessory);
        // this.stateless = this.options.every(option => !option.offable);

        this.createService();
    }

    private createService() {
        const { platformAccessory } = this.accessory;

        const prefixName = this.device.hasOption('Switch.DeviceName.Disable') ? '' : `${this.device.config.name} `;

        this.service =
            platformAccessory.getService(hap.Service.Switch) ||
            new hap.Service.Switch(prefixName + this.accessory.config.name, `switch_${this.accessory.config.identifier}`).setCharacteristic(
                hap.Characteristic.ConfiguredName,
                prefixName + this.accessory.config.name,
            );

        this.service
            .getCharacteristic(hap.Characteristic.On)
            .on(CharacteristicEventTypes.GET, this.getSwitch.bind(this))
            .on(CharacteristicEventTypes.SET, this.setSwitch.bind(this));
    }

    async getSwitch(callback: CharacteristicGetCallback) {
        callback(null, true);
        // let value = false;
        // for (let index in this.options) {
        //     let option = this.options[index];
        //     if (!option.get) {
        //         continue;
        //     }
        //     if (await option.get(option)) {
        //         value = true;
        //     } else {
        //         value = false;
        //         break;
        //     }
        // }
        // callback(null, value);
    }

    async setSwitch(value: CharacteristicValue, callback: CharacteristicGetCallback) {
        // utils.race(this.runSwitch(value))
        // .then(() => callback())
        // .catch(error => {
        //     this.device.log.error(error.message);
        //     this.device.log.debug(error.stack);
        //     if (error instanceof TvOfflineError) {
        //         setTimeout(() => this.updateValue(false), 100);
        //         callback();
        //     } else {
        //         callback(error);
        //     }
        // });
    }

    async runSwitch(value: CharacteristicValue) {
        // for (let index in this.options) {
        //     let option = this.options[index];
        //     if (!value && !option.offable) {
        //         continue;
        //     }
        //     await option.set(value, option);
        //     if (this.options.length > 1 && index < this.options.length - 1) {
        //         await utils.delay(value ? 300 : 50);
        //     }
        // }
        // if (value && this.stateless) {
        //     setTimeout(() => this.updateValue(false), 100);
        // }
    }
}
