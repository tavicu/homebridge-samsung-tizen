import { Categories, PlatformAccessory } from 'homebridge';
import { Device } from '../device/index.js';
import { withInputIdentifiers } from '../lib/identifiers.js';
import { SamsungPlatform } from '../platform.js';
import { InformationService, InputService, SpeakerService, TelevisionService } from '../services/index.js';
import { LinkedService } from '../types/index.js';
import { SwitchAccessory } from './switch.js';

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
    withInputIdentifiers(this.device.config.inputs).forEach((inputConfig) => {
      try {
        this.inputs.push(new InputService(inputConfig, this));
      } catch (error) {
        this.device.log.error(error.message);
      }
    });
  }

  private createServices() {
    this.services = {
      main: new TelevisionService(this),
      speaker: new SpeakerService(this),
      information: new InformationService(this),
    };

    this.getServices().forEach((service) => {
      if (!this.platformAccessory.services.includes(service)) {
        this.platformAccessory.addService(service);
      }

      if (service.linked) {
        this.services.main.addLinkedService(service);
      }
    });
  }

  private getServices(): LinkedService[] {
    return [...Object.values(this.services).map((wrapper) => wrapper.service), ...this.inputs.map((input) => input.service)];
  }

  public getMain(): boolean {
    if (this.device.isFrame) {
      return this.device.power && !this.device.artmode;
    }

    return this.device.power;
  }

  public setMain(value: boolean): Promise<void> {
    if (this.device.isFrame) {
      return this.device.setArtMode(!value);
    }

    return this.device.setPower(value);
  }

  public addAccessory(accessory: SwitchAccessory) {
    accessory.getAttachedServices().forEach((service) => {
      if (service.subtype && this.platformAccessory.getServiceById(this.platform.api.hap.Service.Switch, service.subtype)) {
        return;
      }

      this.platformAccessory.addService(service);
    });
  }
}
