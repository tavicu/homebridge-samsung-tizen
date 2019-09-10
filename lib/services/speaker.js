let Hap, Device;

module.exports = class Speaker {
    constructor(accessory) {
        Hap    = accessory.hap;
        Device = accessory.device;

        this.createService();
    }

    createService() {
        this.service = new Hap.Service.TelevisionSpeaker(Device.config.name + ' Volume')
            .setCharacteristic(Hap.Characteristic.VolumeControlType, Hap.Characteristic.VolumeControlType.ABSOLUTE);

        this.service.getCharacteristic(Hap.Characteristic.VolumeSelector)
            .on('set', this.setVolume.bind(this));

        this.service.linked = true;
    }

    setVolume(value, callback) {
        Device.remote.command(value ? 'KEY_VOLDOWN' : 'KEY_VOLUP').then(() => {
            callback();
        })
        .catch(error => {
            Device.debug(error.stack);

            callback();
        });
    }
}