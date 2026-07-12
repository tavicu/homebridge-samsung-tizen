import { Characteristic } from 'homebridge';
import { TelevisionAccessory } from '../accessories/television.js';
import { Device } from '../device/device.js';
import { race } from '../lib/tools.js';
import { SamsungPlatform } from '../platform.js';
import { InputConfig, LinkedService } from '../types/index.js';

export class InputService {
  public service: LinkedService;
  public stateless: boolean;
  private device: Device;
  private platform: SamsungPlatform;
  private characteristic: typeof Characteristic;

  constructor(
    public config: InputConfig,
    private accessory: TelevisionAccessory,
  ) {
    this.device = this.accessory.device;
    this.platform = this.accessory.platform;
    this.characteristic = this.platform.api.hap.Characteristic;

    this.stateless = ['command'].includes(config.type);

    this.service = new this.platform.api.hap.Service.InputSource(config.name, `input_${config.identifier}`)
      .setCharacteristic(this.characteristic.Identifier, config.identifier)
      .setCharacteristic(this.characteristic.ConfiguredName, config.name)
      .setCharacteristic(this.characteristic.IsConfigured, this.characteristic.IsConfigured.CONFIGURED)
      .setCharacteristic(this.characteristic.InputSourceType, this.getSourceType())
      .setCharacteristic(this.characteristic.TargetVisibilityState, this.characteristic.TargetVisibilityState.SHOWN)
      .setCharacteristic(this.characteristic.CurrentVisibilityState, this.characteristic.CurrentVisibilityState.SHOWN);

    this.service.linked = true;
  }

  private getSourceType(): number {
    const { type, value } = this.config;

    if (typeof value !== 'string') {
      return this.characteristic.InputSourceType.OTHER;
    }

    if (type === 'app') {
      return this.characteristic.InputSourceType.APPLICATION;
    }

    if (value === 'digitalTv') {
      return this.characteristic.InputSourceType.TUNER;
    }

    if (value === 'USB') {
      return this.characteristic.InputSourceType.USB;
    }

    if (value && value.startsWith('HDMI')) {
      return this.characteristic.InputSourceType.HDMI;
    }

    return this.characteristic.InputSourceType.OTHER;
  }

  public async getInput(): Promise<boolean> {
    const { type, value } = this.config;

    if (type === 'app') {
      try {
        const { visible } = await this.device.getApplication(value);
        return visible as boolean;
      } catch {}
    }

    return false;
  }

  public async setInput() {
    await race(this.runInput());

    return this;
  }

  private async runInput(): Promise<void> {
    const { value, type } = this.config;

    switch (type) {
      case 'app':
        await this.device.startApplication(value);
        break;

      case 'command':
        await this.device.sendCommand(value);
        break;
    }
  }
}
