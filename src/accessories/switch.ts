import { Categories, PlatformAccessory } from 'homebridge';
import { Device } from '../device/index.js';
import { SamsungPlatform } from '../platform.js';
import { InformationService, SwitchService } from '../services/index.js';
import { SwitchConfig } from '../types/index.js';

export class SwitchAccessory {
  public UUID: string;

  public services: any = {};
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
    // Services
    this.services.main = new SwitchService(this);
    this.services.information = new InformationService(this);

    // Add services
    this.getServices().forEach((service) => {
      try {
        this.platformAccessory.addService(service);
      } catch (error) {}
    });
  }

  private getServices() {
    return Object.values(this.services)
      .map((type: any) => type.service)
      .flat();
  }
}
