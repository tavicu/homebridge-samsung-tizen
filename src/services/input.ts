import { HAP } from 'homebridge';
import { InputConfig } from '../types';

import { delay, race } from '../tools';

let hap: HAP;

export class InputService {
    public service;
    public stateless: boolean;

    constructor(public config: InputConfig, public accessory) {
        const { platform } = accessory;
        hap = platform.api.hap;

        this.stateless = ['input', 'app', 'art'].indexOf(config.type) === -1;

        this.service = new hap.Service.InputSource(config.name, `input_${config.identifier}`)
            .setCharacteristic(hap.Characteristic.Identifier, config.identifier)
            .setCharacteristic(hap.Characteristic.ConfiguredName, config.name)
            .setCharacteristic(hap.Characteristic.IsConfigured, hap.Characteristic.IsConfigured.CONFIGURED)
            .setCharacteristic(hap.Characteristic.InputSourceType, this.getSourceType())
            .setCharacteristic(hap.Characteristic.TargetVisibilityState, hap.Characteristic.TargetVisibilityState.SHOWN)
            .setCharacteristic(hap.Characteristic.CurrentVisibilityState, hap.Characteristic.CurrentVisibilityState.SHOWN);

        this.service.linked = true;
    }

    private getSourceType() {
        const { value, type } = this.config;

        if (typeof value !== 'string') {
            return hap.Characteristic.InputSourceType.OTHER;
        }

        if (type === 'app') {
            return hap.Characteristic.InputSourceType.APPLICATION;
        }

        if (value === 'digitalTv') {
            return hap.Characteristic.InputSourceType.TUNER;
        }

        if (value === 'USB') {
            return hap.Characteristic.InputSourceType.USB;
        }

        if (value && value.startsWith('HDMI')) {
            return hap.Characteristic.InputSourceType.HDMI;
        }

        return hap.Characteristic.InputSourceType.OTHER;
    }

    // TODO
    async getInput() {
        const { type } = this.config;

        if (type === 'art') {
            await delay(150);
            // return this.device.remote.getArtMode();
        } else if (type === 'app') {
            // let application = await this.device.remote.getApplication(this.config.value);
            // return application.visible;
        } else if (type === 'input') {
            // let input = await this.device.remote.getInputSource();
            // return input.value == this.config.value;
        }

        return false;
    }

    // TODO
    async setInput() {
        // await utils.race(this.runInput());

        return this;
    }

    // TODO
    async runInput() {
        const { type } = this.config;

        switch (type) {
            case 'art':
                // await this.device.remote.setArtMode(true);
                break;

            case 'app':
                // await this.device.remote.setApplication(this.config.value);
                break;

            case 'input':
                // await this.device.remote.setInputSource(this.config.value);
                break;

            case 'command':
                // await this.device.remote.command(this.config.value);
                break;
        }
    }
}
