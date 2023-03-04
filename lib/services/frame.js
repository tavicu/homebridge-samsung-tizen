let Hap;

module.exports = class Frame {
    constructor(accessory, homebridge) {
        Hap = homebridge.hap;

        this.device    = accessory.device;
        this.services  = [];

        this.createService();
    }

    createService() {
        const prefixName = this.device.hasOption('Switch.DeviceName.Disable') ? '' : `${this.device.config.name} `;

        if (!this.device.hasOption('Frame.ArtSwitch.Disable')) {
            let service = new Hap.Service.Switch(prefixName + 'Art Mode', 'frame.art');

            service.getCharacteristic(Hap.Characteristic.On)
                .on('get', this.getArtMode.bind(this))
                .on('set', this.setArtMode.bind(this));

            this.services.push(service);
        }

        if (!this.device.hasOption('Frame.PowerSwitch.Disable')) {
            let service = new Hap.Service.Switch(prefixName + 'Power', 'frame.power');

            service.getCharacteristic(Hap.Characteristic.On)
                .on('get', this.getPower.bind(this))
                .on('set', this.setPower.bind(this));

            this.services.push(service);
        }
    }

    getValue() {
        this.services.forEach(service => service.getCharacteristic(Hap.Characteristic.On).getValue());
    }

    updateValue(value, service) {
        service = service || this.services[0];

        if (service) {
            service.getCharacteristic(Hap.Characteristic.On).updateValue(value);
        }
    }

    async getArtMode(callback) {
        this.device.remote.getArtMode().then(status => {
            callback(null, status);
        });
    }

    async setArtMode(value, callback) {
        this.device.remote.setArtMode(value).then(() => {
            callback();
        })
        .catch(error => {
            this.device.log.error(error.message);
            this.device.log.debug(error.stack);

            callback(error);
        });
    }

    async getPower(callback) {
        this.device.remote.getPower().then(status => {
            callback(null, status);
        });
    }

    async setPower(value, callback) {
        this.device.remote.setPower(value).then(() => {
            callback();
        })
        .catch(error => {
            this.device.log.error(error.message);
            this.device.log.debug(error.stack);

            callback(error);
        });
    }
}