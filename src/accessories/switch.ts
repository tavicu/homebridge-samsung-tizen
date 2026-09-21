import { Device } from '../device/index.js';
import { SamsungPlatform } from '../platform.js';
import { SwitchService } from '../services/index.js';
import { LinkedService, SwitchConfig } from '../types/index.js';

export type SwitchServices = {
  main: SwitchService;
};

export class SwitchAccessory {
  public services!: SwitchServices;

  constructor(
    public config: SwitchConfig,
    public device: Device,
    public platform: SamsungPlatform,
  ) {
    if (!config.name) {
      throw new Error(`Switch name is required for ${device.config.name}`);
    }

    this.createServices();
  }

  private createServices() {
    this.services = {
      main: new SwitchService(this),
    };

    this.device.mainAccessory.addAccessory(this);
  }

  public getAttachedServices(): LinkedService[] {
    return [this.services.main.service];
  }
}
