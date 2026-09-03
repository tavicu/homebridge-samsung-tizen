import { CharacteristicValue } from 'homebridge';
import { SwitchAccessory } from '../accessories/switch.js';
import { TvOfflineError } from '../errors.js';
import { getSwitchOptions } from '../lib/switch.js';
import { sleep } from '../lib/tools.js';
import { LinkedService, SwitchOption } from '../types/index.js';
import { ServiceWrapper } from './wrapper.js';

export class SwitchService extends ServiceWrapper {
  public options: SwitchOption[];
  public stateless: boolean;
  public service: LinkedService;

  constructor(private accessory: SwitchAccessory) {
    super(accessory);

    this.options = getSwitchOptions(this.accessory, this.device, this);
    this.stateless = this.options.every((option) => !option.get);

    const prefixName = this.device.hasOption('Switch.DeviceName.Disable') ? '' : `${this.device.config.name} `;
    const switchName = prefixName + this.accessory.config.name;

    this.service = new this.hap.Service.Switch(switchName, `switch_${this.accessory.config.identifier}`).setCharacteristic(this.characteristic.ConfiguredName, switchName);

    this.service.getCharacteristic(this.characteristic.On).onGet(this.getSwitch.bind(this)).onSet(this.setSwitch.bind(this));
  }

  public async updateValue(value?: boolean): Promise<void> {
    const finalValue = value !== undefined ? value : await this.getSwitch();

    this.handleUpdateValue(this.characteristic.On, finalValue);
  }

  public async pollValue(): Promise<void> {
    if (this.stateless || !this.options.some((option) => option.polled)) {
      return;
    }

    await this.updateValue();
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
    } catch (error) {
      this.device.log.debug(`Failed to get switch state: ${error?.message || error}`);

      return false;
    }
  }

  private async setSwitch(value: CharacteristicValue) {
    await this.handleSet(this.runSwitch(value as boolean), {
      errorMessage: 'Failed to set switch state',
      onError: (error) => {
        if (error instanceof TvOfflineError) {
          this.device.log.warn(`Switch "${this.accessory.config.name}" was turned back off because the TV is off. Enable power on this switch if it should wake the TV.`);

          setTimeout(() => this.updateValue(false), 500);
          return true;
        }
      },
    });
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
      setTimeout(() => this.updateValue(false), 500);
    }
  }
}
