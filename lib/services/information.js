let Hap;

module.exports = class Information {
    constructor(accessory, homebridge) {
        Hap = homebridge.hap;

        this.device  = accessory.device;
        this.service = accessory.platformAccessory.getService(Hap.Service.AccessoryInformation);

        this.createService();
    }

    createService() {
        this.service = this.service || new Hap.Service.AccessoryInformation();

        this.service.setCharacteristic(Hap.Characteristic.Model, 'Tizen OS')
            .setCharacteristic(Hap.Characteristic.Manufacturer, 'Samsung TV')
            .setCharacteristic(Hap.Characteristic.Name, this.device.config.name)
            .setCharacteristic(Hap.Characteristic.SerialNumber, this.device.config.ip);
    }
}