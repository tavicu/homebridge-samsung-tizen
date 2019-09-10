let Hap, Device;

module.exports = class Information {
    constructor(accessory) {
        Hap    = accessory.hap;
        Device = accessory.device;

        this.service = accessory.platformAccessory.getService(Hap.Service.AccessoryInformation);

        this.createService();
    }

    createService() {
        this.service = this.service || new Hap.Service.AccessoryInformation();

        this.service.setCharacteristic(Hap.Characteristic.Model, 'Tizen OS')
            .setCharacteristic(Hap.Characteristic.Manufacturer, 'Samsung TV')
            .setCharacteristic(Hap.Characteristic.Name, Device.config.name)
            .setCharacteristic(Hap.Characteristic.SerialNumber, Device.config.ip);
    }
}