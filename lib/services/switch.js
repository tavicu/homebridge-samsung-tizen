module.exports = class Switch {
    constructor(accessory) {
        this.accessory = accessory;
        this.hap       = accessory.hap;
        this.device    = accessory.device;

        this.createService();
    }

    getValue() {
        this.service.getCharacteristic(this.hap.Characteristic.On).getValue();
    }

    updateValue(value, characteristic) {
        this.service.updateCharacteristic(characteristic || this.hap.Characteristic.On, value);
    }

    getServices() {
        return [this.service];
    }

    createService() {
        this.service = new this.hap.Service.Switch(this.accessory.name);

        this.service.getCharacteristic(this.hap.Characteristic.On)
            .on('get', this.getSwitch.bind(this))
            .on('set', this.setSwitch.bind(this));
    }

    async getSwitch(callback) {
        // console.log('getSwitch');

        for (let index in this.accessory.options) {
            let option = this.accessory.options[index];

            if (option.stateless) {
                continue;
            }

            if (await option.get(option)) {
                return callback(null, true);
            }
        }

        callback(null, false);
    }

    async setSwitch(value, callback) {
        console.log('setSwitch', value, this.accessory.stateless);
        try {
            for (let index in this.accessory.options) {
                let option = this.accessory.options[index];

                if (!value && option.stateless) {
                    continue;
                }

                await option.set(value, option);


                if (this.accessory.options.length > 1 && index < this.accessory.options.length - 1) {
                    await this._delay(value ? 400 : 50);
                }
            }

            if (value && this.accessory.stateless) {
                setTimeout(() => this.updateValue(false), 100);
            }

            callback();
        }
        catch (error) {
            console.log(error);
            callback(error);
        }
    }

    _delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}