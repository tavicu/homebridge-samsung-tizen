import { Categories, PlatformAccessory } from 'homebridge';
import { Device } from '../device/index.js';
import { SamsungPlatform } from '../platform.js';
import { InformationService, SwitchService } from '../services/index.js';
import { LinkedService, SwitchConfig } from '../types/index.js';

export type SwitchServices = {
  main: SwitchService;
  information: InformationService;
};

export class SwitchAccessory {
  public UUID: string;

  public services!: SwitchServices;
  public platformAccessory: PlatformAccessory;

  constructor(
    public config: SwitchConfig,
    public device: Device,
    public platform: SamsungPlatform,
  ) {
    // Check if we have device info
    if (!config.name) {
      throw new Error(`Switch name is required for ${device.config.name}`);
    }

    this.UUID = this.platform.api.hap.uuid.generate(device.UUID + config.identifier + config.name);
    this.platformAccessory = new this.platform.api.platformAccessory(`${device.config.name} ${config.name}`, this.UUID, Categories.SWITCH);

    this.createServices();
  }

  private createServices() {
    this.services = {
      main: new SwitchService(this),
      information: new InformationService(this),
    };

    this.getServices().forEach((service) => {
      try {
        this.platformAccessory.addService(service);
      } catch (error) {}
    });
  }

  private getServices(): LinkedService[] {
    return Object.values(this.services).map((wrapper) => wrapper.service);
  }
}
