let Hap;

module.exports = class Frame {
    constructor(accessory, homebridge) {
        Hap = homebridge.hap;

        this.device    = accessory.device;
        this.accessory = accessory;
        this.service   = this.accessory.platformAccessory.getService(Hap.Service.Switch);

        this.createService();
    }

    createService() {
        this.service = this.service || new Hap.Service.Switch(`${this.device.config.name} ${this.accessory.config.name}`, 'frame.power');

        this.service.getCharacteristic(Hap.Characteristic.On)
            .on('get', this.getOn.bind(this))
            .on('set', this.setOn.bind(this));
    }

    getValue() {
        this.service.getCharacteristic(Hap.Characteristic.On).getValue();
    }

    updateValue(value, characteristic) {
        this.service.getCharacteristic(characteristic || Hap.Characteristic.On).updateValue(value);
    }

    async getOn(callback) {
        this.device.remote.getActive({power: true}).then(status => {
            callback(null, status);
        });
    }

    async setOn(value, callback) {
        this.device.remote.setActive(value, {power: true, wait: false}).then(() => {
            callback();
        })
        .catch(error => {
            this.device.log.error(error.message);
            this.device.log.debug(error.stack);

            callback(error);
        });
    }
}