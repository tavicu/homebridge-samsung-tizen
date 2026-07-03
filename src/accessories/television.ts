import { Categories, PlatformAccessory } from 'homebridge';

import { Device } from '../device/index.js';
import { SamsungPlatform } from '../platform.js';
import { TelevisionService, SpeakerService, InformationService, InputService } from '../services/index.js';

export class TelevisionAccessory {
  public type: string = 'television';
  public platformAccessory: PlatformAccessory;

  public inputs: any = [];
  public services: any = {};

  constructor(
    public device: Device,
    public platform: SamsungPlatform,
  ) {
    const { api } = platform;

    this.platformAccessory = new api.platformAccessory(device.config.name, device.UUID, Categories.TELEVISION);

    // this.createInputs();
    this.createServices();
  }

  private createInputs() {
    const { inputs = [] } = this.device.config;

    // Create inputs
    inputs.forEach((inputConfig) =>
      this.inputs.push(
        new InputService(
          {
            ...inputConfig,
            identifier: this.inputs.length + 1,
          },
          this,
        ),
      ),
    );
  }

  private createServices() {
    // Services
    this.services.main = new TelevisionService(this);
    this.services.speaker = new SpeakerService(this);
    this.services.information = new InformationService(this);

    // Add linked services
    this.getServices().forEach((service) => {
      try {
        this.platformAccessory.addService(service);
      } catch (error) {
        /* empty */
      }

      if (service.linked) {
        this.services.main.addLinkedService(service);
      }
    });
  }

  private getServices() {
    return [...Object.values(this.services).map((type: any) => type.service), ...Object.values(this.inputs).map((type: any) => type.service)].flat();
  }

  addAccessory(accessory) {
    if (!accessory?.services?.main) {
      return;
    }

    [accessory.services.main.service, ...(accessory.services.main.services || [])].forEach((service) => {
      if (this.platformAccessory.getServiceById(this.platform.api.hap.Service.Switch, service.subtype)) {
        return;
      }

      this.platformAccessory.addService(service);
    });
  }
}
