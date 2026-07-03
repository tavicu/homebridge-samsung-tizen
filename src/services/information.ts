import { HAP } from 'homebridge';

export class InformationService {
  public service;

  constructor(public accessory) {
    const { device, platform, platformAccessory } = accessory;
    const hap: HAP = platform.api.hap;

    this.service = platformAccessory.getService(hap.Service.AccessoryInformation) || new hap.Service.AccessoryInformation();

    this.service
      .setCharacteristic(hap.Characteristic.Model, 'Tizen OS')
      .setCharacteristic(hap.Characteristic.Manufacturer, 'Samsung TV')
      .setCharacteristic(hap.Characteristic.Name, device.config.name)
      .setCharacteristic(hap.Characteristic.SerialNumber, device.config.ip);
  }
}
