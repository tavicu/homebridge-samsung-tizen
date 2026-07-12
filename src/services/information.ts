import { Characteristic } from 'homebridge';
import { SwitchAccessory, TelevisionAccessory } from '../accessories/index.js';
import { LinkedService } from '../types/types.js';

export class InformationService {
  public service: LinkedService;
  private characteristic: typeof Characteristic;

  constructor(private accessory: TelevisionAccessory | SwitchAccessory) {
    const { device, platform } = this.accessory;
    this.characteristic = platform.api.hap.Characteristic;

    this.service = new platform.api.hap.Service.AccessoryInformation(device.config.name)
      .setCharacteristic(this.characteristic.Model, device.storage.model || 'Tizen OS')
      .setCharacteristic(this.characteristic.Manufacturer, 'Samsung TV')
      .setCharacteristic(this.characteristic.Name, device.config.name)
      .setCharacteristic(this.characteristic.SerialNumber, device.config.ip)
      .setCharacteristic(this.characteristic.FirmwareRevision, device.storage.firmware || 'Unknown');
  }
}
