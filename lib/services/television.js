let Hap;

const { TvOfflineError } = require('../errors');

module.exports = class Television {
    constructor(accessory, homebridge) {
        Hap = homebridge.hap;

        this.device    = accessory.device;
        this.accessory = accessory;

        this.remoteKeys = require('../options/remote')(this.device, Hap);

        this.createService();
    }

    createService() {
        this.service = new Hap.Service.Television(this.device.config.name)
            .setCharacteristic(Hap.Characteristic.ConfiguredName, this.device.config.name)
            .setCharacteristic(Hap.Characteristic.SleepDiscoveryMode, Hap.Characteristic.SleepDiscoveryMode.ALWAYS_DISCOVERABLE);

        this.service.getCharacteristic(Hap.Characteristic.Active)
            .on('get', this.getActive.bind(this))
            .on('set', this.setActive.bind(this));

        this.service.getCharacteristic(Hap.Characteristic.RemoteKey)
            .on('set', this.setRemote.bind(this));

        this.service.getCharacteristic(Hap.Characteristic.ActiveIdentifier)
            .on('get', this.getInput.bind(this))
            .on('set', this.setInput.bind(this));
    }

    getValue() {
        this.service.getCharacteristic(Hap.Characteristic.Active).getValue();
    }

    updateValue(value, characteristic) {
        this.service.getCharacteristic(characteristic || Hap.Characteristic.Active).updateValue(value);
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
            this.device.log.error(error.message);
            this.device.log.debug(error.stack);

            callback(error);
        });
    }

    setRemote(value, callback) {
        this.device.remote.command(this.remoteKeys[value]).then(() => {
            callback();
        })
        .catch(error => {
            this.device.log.error(error.message);
            this.device.log.debug(error.stack);

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
            this.updateValue(input ? input.config.identifier : 0, Hap.Characteristic.ActiveIdentifier);

            callback();
        })
        .catch(error => {
            this.device.log.debug(error.stack);

            callback();
        });
    }

    setInput(value, callback) {
        this.device.remote.getActive().then(async (status) => {
            if (!status) {
                throw new TvOfflineError();
            }

            let input = this.accessory.inputs.find(input => input.config.identifier == value);

            await input.setInput();

            return input;
        })
        .then(input => {
            if (input.config.type != 'app') {
                setTimeout(() => this.updateValue(0, Hap.Characteristic.ActiveIdentifier), 150);
            }

            callback();
        })
        .catch(error => {
            this.device.log.debug(error.stack);

            setTimeout(() => this.updateValue(0, Hap.Characteristic.ActiveIdentifier), 150);

            callback();
        });
    }
}