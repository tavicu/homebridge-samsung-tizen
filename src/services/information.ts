import { SwitchAccessory, TelevisionAccessory } from '../accessories/index.js';
import { LinkedService } from '../types/types.js';
import { ServiceWrapper } from './wrapper.js';

export class InformationService extends ServiceWrapper {
  public service: LinkedService;

  constructor(accessory: TelevisionAccessory | SwitchAccessory) {
    super(accessory);

    this.service = new this.hap.Service.AccessoryInformation(this.device.config.name)
      .setCharacteristic(this.characteristic.Model, this.device.storage.model || 'Tizen OS')
      .setCharacteristic(this.characteristic.Manufacturer, 'Samsung TV')
      .setCharacteristic(this.characteristic.Name, this.device.config.name)
      .setCharacteristic(this.characteristic.SerialNumber, this.device.config.ip)
      .setCharacteristic(this.characteristic.FirmwareRevision, this.device.storage.firmware || 'Unknown');
  }

  public async updateValue(): Promise<void> {
    this.handleUpdateValue(this.characteristic.Model, this.device.storage.model || 'Tizen OS');
    this.handleUpdateValue(this.characteristic.FirmwareRevision, this.device.storage.firmware || 'Unknown');
  }
}
