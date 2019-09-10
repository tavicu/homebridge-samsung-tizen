let Hap, Device, Accessory;

const { TvOfflineError } = require('../errors');

module.exports = class Television {
    constructor(accessory) {
        Hap       = accessory.hap;
        Device    = accessory.device;
        Accessory = accessory;

        this.remoteKeys = require('../options/remote')(Device, Hap);

        this.createService();
    }

    createService() {
        this.service = new Hap.Service.Television(Device.config.name)
            .setCharacteristic(Hap.Characteristic.ConfiguredName, Device.config.name)
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
        Device.remote.getActive().then(status => {
            callback(null, status);
        });
    }

    setActive(value, callback) {
        Device.remote.setActive(value).then(() => {
            callback();
        })
        .catch(error => {
            Device.error(error.message);
            Device.debug(error.stack);

            callback(error);
        });
    }

    setRemote(value, callback) {
        Device.remote.command(this.remoteKeys[value]).then(() => {
            callback();
        })
        .catch(error => {
            Device.error(error.message);
            Device.debug(error.stack);

            callback(error);
        });
    }

    getInput(callback) {
        Device.remote.getActive().then(async (status) => {
            if (!status) { return; }

            for (let input of Accessory.inputs) {
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
            Device.debug(error.stack);

            callback();
        });
    }

    setInput(value, callback) {
        Device.remote.getActive().then(async (status) => {
            if (!status) {
                throw new TvOfflineError();
            }

            let input = Accessory.inputs.find(input => input.config.identifier == value);

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
            Device.debug(error.stack);

            setTimeout(() => this.updateValue(0, Hap.Characteristic.ActiveIdentifier), 150);

            callback();
        });
    }
}