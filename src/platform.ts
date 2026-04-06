import { API, Logging, IndependentPlatformPlugin } from 'homebridge';

import { PLUGIN_NAME } from './settings';

import { SSDP } from './protocols';
import { Device } from './device';
import { Storage } from './storage';

import { PlatformConfig, DeviceConfig } from './types';

export class SamsungPlatform implements IndependentPlatformPlugin {
    private ssdp: SSDP;
    public storage: Storage;
    public devices: Array<Device> = [];

    constructor(public log: Logging, public config: PlatformConfig, public api: API) {
        this.ssdp = new SSDP(this);
        this.storage = new Storage(api);

        this.initialize();
    }

    private async initialize() {
        await this.storage.initialize();

        this.config.devices?.forEach((deviceConfig: DeviceConfig) => {
            try {
                let mainAccessory;
                const device = new Device(deviceConfig, this);

                this.devices.push(device);

                device.accessories.forEach((accessory) => {
                    if (accessory.type === 'television') {
                        mainAccessory = accessory;
                    } else if (mainAccessory) {
                        mainAccessory.addAccessory(accessory);
                    }
                });

                this.api.publishExternalAccessories(PLUGIN_NAME, [mainAccessory.platformAccessory]);
            } catch (error) {
                this.log.error(error.message);
                this.log.debug(error.stack);
            }
        });

        this.ssdp.start();
    }
}
