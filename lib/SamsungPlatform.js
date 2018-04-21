let Service, Characteristic;

module.exports = (homebridge) => {
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;

    homebridge.registerPlatform('homebridge-samsung-tv', 'SamsungTV', SamsungPlatform);
}

class SamsungPlatform {
    constructor(log, config, api) {
        this.log    = log;
        this.api    = api;
        this.config = config;

        this.devices = config['devices'] || [];
    }

    accessories(callback) {
        let accessoryList = [];

        callback(accessoryList);
    }
}