import { CharacteristicValue } from 'homebridge';
import { TelevisionAccessory } from '../accessories/index.js';
import { debounce } from '../lib/tools.js';
import { LinkedService } from '../types/index.js';
import { ServiceWrapper } from './wrapper.js';

export class VolumeService extends ServiceWrapper {
  public service: LinkedService;

  private pushVolume = debounce((volume: number) => {
    void this.handleSet(this.device.setVolume(volume), { errorMessage: `Failed to set volume to ${volume}` }).catch(() => {});
  }, 500);

  constructor(accessory: TelevisionAccessory) {
    super(accessory);

    const name = `${this.device.config.name} Volume`;

    // Brightness is the scene-friendly volume control. On follows mute while the TV is on, and stays off while it is powered off.
    this.service = new this.hap.Service.Lightbulb(name, 'volume').setCharacteristic(this.characteristic.ConfiguredName, name);
    this.service.getCharacteristic(this.characteristic.On).onGet(this.getOn.bind(this)).onSet(this.setOn.bind(this));
    this.service.getCharacteristic(this.characteristic.Brightness).onGet(this.getVolume.bind(this)).onSet(this.setVolume.bind(this));
  }

  public async updateValue(): Promise<void> {
    this.handleUpdateValue(this.characteristic.On, this.getOn());
    this.handleUpdateValue(this.characteristic.Brightness, this.getVolume());
  }

  private getOn(): CharacteristicValue {
    return this.device.power && !this.device.mute;
  }

  private async setOn(value: CharacteristicValue): Promise<void> {
    if (!this.device.power) {
      // Home commits the written value after onSet resolves, so the restore has to happen after that.
      setTimeout(() => this.handleUpdateValue(this.characteristic.On, false));
      return;
    }

    await this.handleSet(this.device.setMute(!value), { errorMessage: 'Failed to set mute' });
  }

  private getVolume(): CharacteristicValue {
    return this.device.volume ?? 10;
  }

  private async setVolume(value: CharacteristicValue): Promise<void> {
    if (!this.device.power) {
      setTimeout(() => this.handleUpdateValue(this.characteristic.Brightness, this.getVolume()));
      return;
    }

    this.pushVolume(Math.max(0, Math.min(100, Math.round(value as number))));
  }
}
