module.exports = class Information {
    constructor(accessory) {
        this.hap    = accessory.hap;
        this.device = accessory.device;

        this.createService();
    }

    createService() {
        this.service = new this.hap.Service.AccessoryInformation()
            .setCharacteristic(this.hap.Characteristic.Model, 'Tizen OS')
            .setCharacteristic(this.hap.Characteristic.Manufacturer, 'Samsung TV')
            .setCharacteristic(this.hap.Characteristic.Name, this.device.config.name)
            .setCharacteristic(this.hap.Characteristic.SerialNumber, this.device.config.ip);
    }
}