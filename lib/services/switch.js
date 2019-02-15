let OPTIONS = [
    {
        key: 'power',
        stateless: true
    },
    {
        key: 'sleep',
        stateless: false
    },
    {
        key: 'mute',
        stateless: true
    },
    {
        key: 'channel',
        stateless: true
    },
    {
        key: 'app',
        stateless: false
    },
    {
        key: 'command',
        stateless: true
    }
];


module.exports = class Switch {
    constructor(accessory) {
        this.hap       = accessory.hap;
        this.device    = accessory.device;
        this.remote    = accessory.remote;
        this.name      = accessory.name;
        this.stateless = true;

        this.options = OPTIONS.filter(option => {
            if (option.key == 'power' || this.device.config[option.key] != undefined) {
                if (this.stateless && !option.stateless) {
                    this.stateless = false;
                }

                option.value = this.device.config[option.key];
                return true;
            }

            return false;
        });

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

            if (await this['_getOption' + this._ucfirst(option.key)](option)) {
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

                await this['_setOption' + this._ucfirst(option.key)](value, option);

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

    async _setOptionPower(switchValue, option) {
        let isActive = await this.remote.getActive();

        if (!option.value && !isActive) {
            throw new Error('TV is OFF boss');
        }

        if (isActive) {
            return Promise.resolve();
        }

        await this.remote.setActive(true);

        this.device.mainAccessory.updateValue(true);

        await this._delay(1500);
    }

    async _getOptionSleep(option) {
        return this.remote.getSleep();
    }

    async _setOptionSleep(switchValue, option) {
        await this.remote.setSleep(switchValue ? option.value : 0, () => {
            this.characteristic.updateValue(false);
            this.device.mainAccessory.updateValue(false);
        });
    }

    async _setOptionMute(switchValue, option) {
        await this.remote.mute();
    }

    async _setOptionChannel(switchValue, option) {
        await this.remote.setChannel(option.value);
    }

    async _getOptionApp(option) {
        let application = await this.remote.getApplication(option.value);

        return application.visible;
    }

    async _setOptionApp(switchValue, option) {
        if (!switchValue) {
            return setTimeout(() => this.characteristic.getValue(), 100);
        }

        await this.remote.openApplication(option.value);
    }

    async _setOptionCommand(switchValue, option) {
        await this.remote.command(option.value);
    }

    _ucfirst(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    _delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}