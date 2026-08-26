import { Characteristic, CharacteristicValue } from 'homebridge';
import { SwitchAccessory } from '../accessories/switch.js';
import { Device } from '../device/device.js';
import { TvOfflineError } from '../errors.js';
import { getSwitchOptions } from '../lib/switch.js';
import { race, sleep } from '../lib/tools.js';
import { SamsungPlatform } from '../platform.js';
import { LinkedService, SwitchOption } from '../types/index.js';

export class SwitchService {
  public options: any;
  public stateless: boolean;
  public service: LinkedService;
  private device: Device;
  private platform: SamsungPlatform;
  private characteristic: typeof Characteristic;

  constructor(private accessory: SwitchAccessory) {
    this.device = this.accessory.device;
    this.platform = this.accessory.platform;
    this.characteristic = this.platform.api.hap.Characteristic;

    this.options = getSwitchOptions(this.accessory, this.device, this);
    this.stateless = this.options.every((option: SwitchOption) => !option.offable);

    const prefixName = this.device.hasOption('Switch.DeviceName.Disable') ? '' : `${this.device.config.name} `;
    const switchName = prefixName + this.accessory.config.name;

    this.service = new this.platform.api.hap.Service.Switch(switchName, `switch_${this.accessory.config.identifier}`).setCharacteristic(
      this.characteristic.ConfiguredName,
      switchName,
    );

    this.service.getCharacteristic(this.characteristic.On).onGet(this.getSwitch.bind(this)).onSet(this.setSwitch.bind(this));
  }

  public async updateValue(value?: boolean): Promise<void> {
    const finalValue = value !== undefined ? value : await this.getSwitch();

    this.service.updateCharacteristic(this.characteristic.On, finalValue);
  }

  private async getSwitch(): Promise<CharacteristicValue> {
    if (this.stateless) {
      return false;
    }

    try {
      for (const option of this.options) {
        if (!option.get) {
          continue;
        }

        const isOptionActive = await option.get();

        if (isOptionActive) {
          return true;
        }
      }

      return false;
    } catch (error: any) {
      this.device.log.debug(`Failed to get switch state: ${error.message || error}`);

      return false;
    }
  }

  private async setSwitch(value: CharacteristicValue) {
    const switchValue = value as boolean;

    try {
      await race(this.runSwitch(switchValue));
    } catch (error: any) {
      this.device.log.error(`Failed to set switch state: ${error.message || error}`);
      this.device.log.debug(error.stack);

      if (error instanceof TvOfflineError) {
        setTimeout(() => this.updateValue(false), 100);
        return;
      }

      throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);
    }
  }

  private async runSwitch(value: boolean): Promise<void> {
    for (const [i, option] of this.options.entries()) {
      if (!value && !option.offable) {
        continue;
      }

      await option.set(value);

      if (this.options.length > 1 && i < this.options.length - 1) {
        await sleep(value ? 300 : 50);
      }
    }

    if (value && this.stateless) {
      setTimeout(() => this.updateValue(false), 150);
    }
  }
}
