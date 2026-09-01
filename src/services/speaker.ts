import { Characteristic, CharacteristicValue } from 'homebridge';
import { TelevisionAccessory } from '../accessories/television.js';
import { Device } from '../device/device.js';
import { race } from '../lib/tools.js';
import { SamsungPlatform } from '../platform.js';
import { LinkedService } from '../types/index.js';
import { updateValueIfChanged } from './helpers.js';

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
    updateValueIfChanged(this.service, this.characteristic.Mute, await this.getMute());
    updateValueIfChanged(this.service, this.characteristic.Volume, await this.getVolume());
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
      await race(this.device.setMute(value as boolean));
    } catch (error: any) {
      this.device.log.error(`Failed to set mute: ${error.message || error}`);
      this.device.log.debug(error.stack);

      throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);
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
      await race(this.device.setVolume(value as number));
    } catch (error: any) {
      this.device.log.error(`Failed to set volume to ${value}: ${error.message || error}`);
      this.device.log.debug(error.stack);

      throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);
    }
  }

  /**
   * Handles physical Volume Up / Volume Down buttons from iOS Remote
   */
  private async setVolumeSelector(value: CharacteristicValue): Promise<void> {
    try {
      const direction = value as number;

      if (direction === this.characteristic.VolumeSelector.INCREMENT) {
        await race(this.device.sendCommand('KEY_VOLUP'));
      } else if (direction === this.characteristic.VolumeSelector.DECREMENT) {
        await race(this.device.sendCommand('KEY_VOLDOWN'));
      }
    } catch (error: any) {
      this.device.log.error(`Failed to send volume step: ${error.message || error}`);
      this.device.log.debug(error.stack);

      throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);
    }
  }
}
