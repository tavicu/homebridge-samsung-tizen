module.exports = class Speaker {
    constructor(accessory) {
        this.hap    = accessory.hap;
        this.device = accessory.device;
        this.name   = accessory.name + ' Volume';

        this.createService();
    }

    getServices() {
        return [this.service];
    }

    createService() {
        this.service  =  new this.hap.Service.TelevisionSpeaker(this.name)
            .setCharacteristic(this.hap.Characteristic.VolumeControlType, this.hap.Characteristic.VolumeControlType.ABSOLUTE);

        this.service.getCharacteristic(this.hap.Characteristic.VolumeSelector)
            .on('set', this.setVolume.bind(this));
    }

    setVolume(value, callback) {
        this.device.remote.command(value ? 'KEY_VOLDOWN' : 'KEY_VOLUP').then(() => {
            callback();
        })
        .catch(error => {
            this.device.debug(error);

            callback();
        });
    }
}