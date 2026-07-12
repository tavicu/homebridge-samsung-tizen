import { Characteristic, CharacteristicValue } from 'homebridge';
import { TelevisionAccessory } from '../accessories/television.js';
import { Device } from '../device/device.js';
import { SamsungPlatform } from '../platform.js';
import { LinkedService } from '../types/index.js';

export class SpeakerService {
  public service: LinkedService;
  private device: Device;
  private platform: SamsungPlatform;
  private characteristic: typeof Characteristic;

  constructor(private accessory: TelevisionAccessory) {
    this.device = this.accessory.device;
    this.platform = this.accessory.platform;
    this.characteristic = this.platform.api.hap.Characteristic;

    // Create the service and force ABSOLUTE volume control type (0-100)
    this.service = new this.platform.api.hap.Service.TelevisionSpeaker(`${this.device.config.name} Volume`).setCharacteristic(
      this.characteristic.VolumeControlType,
      this.characteristic.VolumeControlType.ABSOLUTE,
    );

    this.service.getCharacteristic(this.characteristic.Mute).onGet(this.getMute.bind(this)).onSet(this.setMute.bind(this));
    this.service.getCharacteristic(this.characteristic.Volume).onGet(this.getVolume.bind(this)).onSet(this.setVolume.bind(this));
    this.service.getCharacteristic(this.characteristic.VolumeSelector).onSet(this.setVolumeSelector.bind(this));

    this.service.linked = true;
  }

  public async updateValue(): Promise<void> {
    const mute = await this.getMute();
    const volume = await this.getVolume();

    this.service.getCharacteristic(this.characteristic.Mute).updateValue(mute);
    this.service.getCharacteristic(this.characteristic.Volume).updateValue(volume);
  }

  /**
   * Gets the Mute state
   */
  private async getMute(): Promise<CharacteristicValue> {
    return this.device.mute ?? false;
  }

  /**
   * Handles the Mute toggle from HomeKit
   */
  private async setMute(value: CharacteristicValue): Promise<void> {
    try {
      await this.device.setMute(value as boolean);
    } catch (error: any) {
      this.device.log.debug(error.stack);
    }
  }

  /**
   * Gets the absolute volume
   */
  private async getVolume(): Promise<CharacteristicValue> {
    return this.device.volume ?? 10;
  }

  /**
   * Handles direct percentage inputs (0-100) via Siri or Automations
   */
  private async setVolume(value: CharacteristicValue): Promise<void> {
    try {
      await this.device.setVolume(value as number);
    } catch (error: any) {
      this.device.log.debug(error.stack);
    }
  }

  /**
   * Handles physical Volume Up / Volume Down buttons from iOS Remote
   */
  private async setVolumeSelector(value: CharacteristicValue): Promise<void> {
    try {
      const direction = value as number;

      if (direction === this.characteristic.VolumeSelector.INCREMENT) {
        await this.device.sendCommand('KEY_VOLUP');
      } else if (direction === this.characteristic.VolumeSelector.DECREMENT) {
        await this.device.sendCommand('KEY_VOLDOWN');
      }
    } catch (error: any) {
      this.device.log.debug(error.stack);
    }
  }
}
