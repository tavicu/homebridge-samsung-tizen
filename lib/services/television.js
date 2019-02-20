module.exports = class Television {
    constructor(accessory) {
        this.accessory = accessory;
        this.hap       = accessory.hap;
        this.remote    = accessory.remote;
        this.name      = accessory.name;

        this.createService();
    }

    createService() {
        this.service = new this.hap.Service.Television(this.name)
            .setCharacteristic(this.hap.Characteristic.ConfiguredName, this.name)
            .setCharacteristic(this.hap.Characteristic.SleepDiscoveryMode, this.hap.Characteristic.SleepDiscoveryMode.ALWAYS_DISCOVERABLE);

        this.characteristic = this.service.getCharacteristic(this.hap.Characteristic.Active);

        this.characteristic
            .on('get', this.getActive.bind(this))
            .on('set', this.setActive.bind(this));

        this.service.getCharacteristic(this.hap.Characteristic.RemoteKey)
            .on('set', this.setRemote.bind(this));

        this.service.getCharacteristic(this.hap.Characteristic.ActiveIdentifier)
            .on('get', this.getInput.bind(this))
            .on('set', this.setInput.bind(this));
    }

    getServices() {
        return [this.service];
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
            callback(error);
        });
    }

    setRemote(value, callback) {
        let map = require('./map')(this.hap);

        this.remote.command(map[value]).then(() => {
            console.log('setRemote then', value);
            callback();
        })
        .catch(error => {
            console.log('setRemote catch', error.message);
            callback(error);
        });
    }

    getInput(callback) {
        this.accessory.services.inputs.getInput().then(identifier => {
            console.log('getInput then', identifier);
            this.service.updateCharacteristic(this.hap.Characteristic.ActiveIdentifier, identifier ? identifier : 0);
        }).catch(error => {
            console.log('getInput catch', error.message);
        }).finally(() => callback());
    }

    setInput(value, callback) {
        this.accessory.services.inputs.setInput(value).then(() => {
            console.log('setInput then', value);
        }).catch(error => {
            console.log('setInput catch', error.message);

            this.service.updateCharacteristic(this.hap.Characteristic.ActiveIdentifier, 0);

        }).finally(() => callback());
    }
}