module.exports = class Television {
    constructor(accessory) {
        this.accessory  = accessory;
        this.hap        = accessory.hap;
        this.device     = accessory.device;
        this.remoteKeys = require('../options/remote')(this);

        this.createService();
    }

    createService() {
        this.service = new this.hap.Service.Television(this.device.config.name)
            .setCharacteristic(this.hap.Characteristic.ConfiguredName, this.device.config.name)
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

    getValue() {
        this.service.getCharacteristic(this.hap.Characteristic.Active).getValue();
    }

    updateValue(value, characteristic) {
        this.service.getCharacteristic(characteristic || this.hap.Characteristic.Active).updateValue(value);
    }

    addLinkedService(newLinkedService) {
        return this.service.addLinkedService(newLinkedService);
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
            this.device.debug(error.stack);

            callback(error);
        });
    }

    setRemote(value, callback) {
        this.device.remote.command(this.remoteKeys[value]).then(() => {
            callback();
        })
        .catch(error => {
            this.device.error(error.message);
            this.device.debug(error.stack);

            callback(error);
        });
    }

    getInput(callback) {
        this.device.remote.getActive().then(async (status) => {
            if (!status) { return; }

            for (let input of this.accessory.inputs) {
                let value = await input.getInput();

                if (value) {
                    return input;
                }
            }
        })
        .then(input => {
            this.updateValue(input ? input.config.identifier : 0, this.hap.Characteristic.ActiveIdentifier);

            callback();
        })
        .catch(error => {
            this.device.debug(error.stack);

            callback();
        });
    }

    setInput(value, callback) {
        this.device.remote.getActive().then(async (status) => {
            if (!status) {
                await this.device.remote.setActive(true);
                await new Promise(resolve => setTimeout(resolve, 2000));
                this.updateValue(true);
            }

            let input = this.accessory.inputs.find(input => input.config.identifier == value);

            await input.setInput();

            return input;
        })
        .then(input => {
            if (input.config.type != 'app') {
                setTimeout(() => this.updateValue(0, this.hap.Characteristic.ActiveIdentifier), 150);
            }

            callback();
        })
        .catch(error => {
            this.device.debug(error.stack);

            setTimeout(() => this.updateValue(0, this.hap.Characteristic.ActiveIdentifier), 150);

            callback();
        });
    }
}