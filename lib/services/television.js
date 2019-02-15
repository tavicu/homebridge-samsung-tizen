module.exports = class Television {
    constructor(accessory) {
        this.hap      = accessory.hap;
        this.remote   = accessory.remote;
        this.name     = accessory.name;

        this.service = new this.hap.Service.Television(this.name)
            .setCharacteristic(this.hap.Characteristic.ConfiguredName, this.name)
            .setCharacteristic(this.hap.Characteristic.SleepDiscoveryMode, this.hap.Characteristic.SleepDiscoveryMode.ALWAYS_DISCOVERABLE);

        this.characteristic = this.service.getCharacteristic(this.hap.Characteristic.Active);

        this.characteristic
            .on('get', this.getActive.bind(this))
            .on('set', this.setActive.bind(this));
    }

    addLinkedService(newLinkedService) {
        return this.service.addLinkedService(newLinkedService);
    }

    getActive(callback) {
        this.remote.getActive().then(status => {
            callback(null, status);
        });
    }

    setActive(value, callback) {
        this.remote.setActive(value).then(() => {
            console.log('setActive then', value);
            callback();
        })
        .catch(error => {
            console.log('setActive catch', error.message);
            callback(error);
        });
    }
}