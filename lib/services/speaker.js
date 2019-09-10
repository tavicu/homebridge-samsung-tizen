let Hap;

module.exports = class Speaker {
    constructor(accessory, homebridge) {
        Hap = homebridge.hap;

        this.device = accessory.device;

        this.createService();
    }

    createService() {
        this.service = new Hap.Service.TelevisionSpeaker(this.device.config.name + ' Volume')
            .setCharacteristic(Hap.Characteristic.VolumeControlType, Hap.Characteristic.VolumeControlType.ABSOLUTE);

        this.service.getCharacteristic(Hap.Characteristic.VolumeSelector)
            .on('set', this.setVolume.bind(this));

        this.service.linked = true;
    }

    setVolume(value, callback) {
        this.device.remote.command(value ? 'KEY_VOLDOWN' : 'KEY_VOLUP').then(() => {
            callback();
        })
        .catch(error => {
            this.device.log.debug(error.stack);

            callback();
        });
    }
}