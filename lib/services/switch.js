module.exports = class Switch {
    constructor(accessory) {
        this.hap       = accessory.hap;
        this.device    = accessory.device;
        this.remote    = accessory.remote;
        this.name      = accessory.name;

        this.options   = require('./options')(this);
        this.stateless = this.options.every(option => option.stateless);

        this.createService();
    }

    createService() {
        this.service = new this.hap.Service.Switch(this.name);

        this.characteristic = this.service.getCharacteristic(this.hap.Characteristic.On);

        this.characteristic
            .on('get', this.getSwitch.bind(this))
            .on('set', this.setSwitch.bind(this));
    }

    async getSwitch(callback) {
        for (let index in this.options) {
            let option = this.options[index];

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
        try {
            for (let index in this.options) {
                let option = this.options[index];

                if (!value && option.stateless) {
                    continue;
                }

                await option.set(value, option);


                if (this.options.length > 1 && index < this.options.length - 1) {
                    await this._delay(value ? 400 : 50);
                }
            }

            if (value && this.stateless) {
                setTimeout(() => this.characteristic.updateValue(false), 100);
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