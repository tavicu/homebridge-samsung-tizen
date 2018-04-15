let Service, Characteristic;
let SamsungRemote = require('./lib/SamsungRemote.js');

module.exports = (homebridge) => {
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;

    homebridge.registerAccessory('homebridge-samsung-tv', 'SamsungTV', SamsungTV);
}


class SamsungTV {
    constructor(log, config) {
        this.log    = log;
        this.config = config;

        if (!config.ip) throw new Error("TV IP address is required");
        if (!config.mac) throw new Error("TV MAC address is required");

        this.TV = new SamsungRemote(log, config);

        this.service = new Service.Switch(this.TV.name);

        this.service.getCharacteristic(Characteristic.On)
            .on('get', this._getOn.bind(this))
            .on('set', this._setOn.bind(this));
    }

    getInformationService() {
        return new Service.AccessoryInformation()
            .setCharacteristic(Characteristic.Name, this.TV.name)
            .setCharacteristic(Characteristic.Manufacturer, 'Samsung TV')
            .setCharacteristic(Characteristic.Model, 'Tizen')
            .setCharacteristic(Characteristic.SerialNumber, this.TV.ip);
    }

    getServices() {
        return [this.service, this.getInformationService()];
    }



    async _getOn(callback) {
        let status = await this.TV.isOn();

        callback(null, status);
    }

    async _setOn(value, callback) {
        try {
            if (value) {
                await this.TV.turnOn();
            } else {
                await this.TV.turnOff();
            }

            callback();
        } catch (error) {
            callback(error);

            setTimeout(() => this.service.getCharacteristic(Characteristic.On).updateValue(!value), 50);
        }
    }
}