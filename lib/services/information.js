module.exports = class Information {
    constructor(accessory) {
        this.hap    = accessory.hap;
        this.device = accessory.device;
        this.name   = accessory.name;

        this.createService();
    }

    createService() {
        this.service = new this.hap.Service.AccessoryInformation()
            .setCharacteristic(this.hap.Characteristic.Name, this.name)
            .setCharacteristic(this.hap.Characteristic.Manufacturer, 'Samsung TV')
            .setCharacteristic(this.hap.Characteristic.Model, 'Tizen')
            .setCharacteristic(this.hap.Characteristic.SerialNumber, this.device.config.ip);
    }

    getServices() {
        return [this.service];
    }
}