import { HAP, PlatformAccessory } from 'homebridge';
import { Device } from '../device';
import { SamsungPlatform } from '../platform';
import { SwitchConfig } from '../types';
import { SwitchService, InformationService } from '../services';

export class SwitchAccessory {
    public type: string = 'switch';
    public UUID: string;

    public services: any = {};
    public platformAccessory: PlatformAccessory;

    constructor(public config: SwitchConfig, public device: Device, public platform: SamsungPlatform) {
        const { api } = platform;
        const hap: HAP = api.hap;

        // Check if we have device info
        if (!config.name) {
            throw new Error(`Switch name is required for ${device.config.name}`);
        }

        this.UUID = hap.uuid.generate(device.UUID + config.identifier + config.name);
        this.platformAccessory = new api.platformAccessory(`${device.config.name} ${config.name}`, this.UUID);

        this.createServices();
    }

    private createServices() {
        // Services
        this.services.main = new SwitchService(this);
        this.services.information = new InformationService(this);

        // Add services
        this.getServices().forEach((service) => {
            try {
                this.platformAccessory.addService(service);
            } catch (error) {
                /* empty */
            }
        });
    }

    private getServices() {
        return Object.values(this.services)
            .map((type: any) => type.service)
            .flat();
    }
}
