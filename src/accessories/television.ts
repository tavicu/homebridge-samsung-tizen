import { Categories, PlatformAccessory } from 'homebridge';
import { Device } from '../device/index.js';
import { SamsungPlatform } from '../platform.js';
import { InformationService, InputService, SpeakerService, TelevisionService } from '../services/index.js';
import { LinkedService } from '../types/index.js';
import { SwitchAccessory } from './index.js';

export type TelevisionServices = {
  main: TelevisionService;
  speaker: SpeakerService;
  information: InformationService;
};

export class TelevisionAccessory {
  public platformAccessory: PlatformAccessory;

  public inputs: InputService[] = [];
  public services!: TelevisionServices;

  constructor(
    public device: Device,
    public platform: SamsungPlatform,
  ) {
    this.platformAccessory = new platform.api.platformAccessory(device.config.name, device.UUID, Categories.TELEVISION);

    this.createInputs();
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
    this.services = {
      main: new TelevisionService(this),
      speaker: new SpeakerService(this),
      information: new InformationService(this),
    };

    this.getServices().forEach((service) => {
      try {
        this.platformAccessory.addService(service);
      } catch (error) {}

      if (service.linked) {
        this.services.main.addLinkedService(service);
      }
    });
  }

  private getServices(): LinkedService[] {
    return [...Object.values(this.services).map((wrapper) => wrapper.service), ...this.inputs.map((input) => input.service)];
  }

  public addAccessory(accessory: SwitchAccessory) {
    const service = accessory.services.main.service;

    if (service.subtype && this.platformAccessory.getServiceById(this.platform.api.hap.Service.Switch, service.subtype)) {
      return;
    }

    this.platformAccessory.addService(service);
  }
}
