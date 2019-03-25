module.exports = class Television {
    constructor(accessory) {
        this.accessory = accessory;
        this.hap       = accessory.hap;
        this.device    = accessory.device;

        this.createService();
    }

    getValue() {
        this.service.getCharacteristic(this.hap.Characteristic.Active).getValue();
    }

    updateValue(value, characteristic) {
        this.service.getCharacteristic(characteristic || this.hap.Characteristic.Active).updateValue(value);
    }

    addLinkedService(newLinkedService) {
        return this.service.addLinkedService(newLinkedService);
    }

    getServices() {
        return [this.service];
    }

    createService() {
        this.service = new this.hap.Service.Television(this.accessory.name)
            .setCharacteristic(this.hap.Characteristic.ConfiguredName, this.accessory.name)
            .setCharacteristic(this.hap.Characteristic.SleepDiscoveryMode, this.hap.Characteristic.SleepDiscoveryMode.ALWAYS_DISCOVERABLE);

        this.service.getCharacteristic(this.hap.Characteristic.Active)
            .on('get', this.getActive.bind(this))
            .on('set', this.setActive.bind(this));

        this.service.getCharacteristic(this.hap.Characteristic.RemoteKey)
            .on('set', this.setRemote.bind(this));

        this.service.getCharacteristic(this.hap.Characteristic.ActiveIdentifier)
            .on('get', this.getInput.bind(this))
            .on('set', this.setInput.bind(this));
    }

    getActive(callback) {
        this.device.remote.getActive().then(status => {
            callback(null, status);
        });
    }

    setActive(value, callback) {
        this.device.remote.setActive(value).then(() => {
            callback();
        })
        .catch(error => {
            this.device.error(error.message);
            this.device.debug(error);

            callback(error);
        });
    }

    setRemote(value, callback) {
        let map = require('../options/remote')(this.hap);

        this.device.remote.command(map[value]).then(() => {
            callback();
        })
        .catch(error => {
            this.device.error(error.message);
            this.device.debug(error);

            callback(error);
        });
    }

    getInput(callback) {
        this.accessory.services.inputs.getInput().then(identifier => {
            this.updateValue(identifier ? identifier : 0, this.hap.Characteristic.ActiveIdentifier);

            callback();
        }).catch(error => {
            this.device.debug(error);

            callback();
        });
    }

    setInput(value, callback) {
        this.accessory.services.inputs.setInput(value).then(input => {
            if (input.type != 'app') {
                setTimeout(() => this.updateValue(0, this.hap.Characteristic.ActiveIdentifier), 150);
            }

            callback();
        }).catch(error => {
            this.device.debug(error);

            setTimeout(() => this.updateValue(0, this.hap.Characteristic.ActiveIdentifier), 150);

            callback();
        });
    }
}