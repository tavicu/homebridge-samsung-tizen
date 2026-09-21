import { CharacteristicValue } from 'homebridge';
import { TelevisionAccessory } from '../accessories/index.js';
import { LinkedService } from '../types/index.js';
import { ServiceWrapper } from './wrapper.js';

export class SpeakerService extends ServiceWrapper {
  public service: LinkedService;

  constructor(accessory: TelevisionAccessory) {
    super(accessory);

    // HomeKit volume is absolute 0-100, not relative steps.
    this.service = new this.hap.Service.TelevisionSpeaker(`${this.device.config.name} Volume`)
      .setCharacteristic(this.characteristic.VolumeControlType, this.characteristic.VolumeControlType.ABSOLUTE)
      .setCharacteristic(this.characteristic.Active, this.getActive());

    this.service.getCharacteristic(this.characteristic.Active).onGet(this.getActive.bind(this));
    this.service.getCharacteristic(this.characteristic.Mute).onGet(this.getMute.bind(this)).onSet(this.setMute.bind(this));
    this.service.getCharacteristic(this.characteristic.Volume).onGet(this.getVolume.bind(this)).onSet(this.setVolume.bind(this));
    this.service.getCharacteristic(this.characteristic.VolumeSelector).onSet(this.setVolumeSelector.bind(this));

    this.service.linked = true;
  }

  public async updateValue(): Promise<void> {
    this.handleUpdateValue(this.characteristic.Active, this.getActive());
    this.handleUpdateValue(this.characteristic.Mute, await this.getMute());
    this.handleUpdateValue(this.characteristic.Volume, await this.getVolume());
  }

  private getActive(): CharacteristicValue {
    return this.device.power ? this.characteristic.Active.ACTIVE : this.characteristic.Active.INACTIVE;
  }

  private async getMute(): Promise<CharacteristicValue> {
    return this.device.mute ?? false;
  }

  private async setMute(value: CharacteristicValue): Promise<void> {
    await this.handleSet(this.device.setMute(value as boolean), { errorMessage: 'Failed to set mute' });
  }

  private async getVolume(): Promise<CharacteristicValue> {
    return this.device.volume ?? 10;
  }

  private async setVolume(value: CharacteristicValue): Promise<void> {
    await this.handleSet(this.device.setVolume(value as number), { errorMessage: `Failed to set volume to ${value}` });
  }

  private async setVolumeSelector(value: CharacteristicValue): Promise<void> {
    const command = {
      [this.characteristic.VolumeSelector.INCREMENT]: 'KEY_VOLUP',
      [this.characteristic.VolumeSelector.DECREMENT]: 'KEY_VOLDOWN',
    }[value as number];

    if (!command) {
      return;
    }

    await this.handleSet(this.device.sendCommand(command), { errorMessage: 'Failed to send volume step' });
  }
}
