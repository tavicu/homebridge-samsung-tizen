import { Device } from '../device/index.js';
import { SamsungPlatform } from '../platform.js';
import { FrameService } from '../services/index.js';
import { LinkedService } from '../types/index.js';

export type FrameServices = {
  art?: FrameService;
  power?: FrameService;
};

export class FrameAccessory {
  public services: FrameServices = {};

  constructor(
    public device: Device,
    public platform: SamsungPlatform,
  ) {
    device.once('paired', () => device.isFrame && this.createServices());
  }

  private createServices() {
    if (Object.keys(this.services).length) {
      return;
    }

    if (!this.device.hasOption('Frame.ArtSwitch.Disable')) {
      this.services.art = new FrameService(this, 'art');
    }

    if (!this.device.hasOption('Frame.PowerSwitch.Disable')) {
      this.services.power = new FrameService(this, 'power');
    }

    this.device.mainAccessory.addAccessory(this);
  }

  public getAttachedServices(): LinkedService[] {
    return [this.services.art, this.services.power].flatMap((service) => (service ? [service.service] : []));
  }
}
