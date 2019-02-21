module.exports = class Speaker {
    constructor(accessory) {
        this.hap    = accessory.hap;
        this.device = accessory.device;
        this.name   = accessory.name + ' Volume';

        this.createService();
    }

    createService() {
        this.service  =  new this.hap.Service.TelevisionSpeaker(this.name)
            .setCharacteristic(this.hap.Characteristic.VolumeControlType, this.hap.Characteristic.VolumeControlType.ABSOLUTE);

        this.service.getCharacteristic(this.hap.Characteristic.VolumeSelector)
            .on('set', this.setVolume.bind(this));
    }

    getServices() {
        return [this.service];
    }

    setVolume(value, callback) {
        this.device.remote.command(value ? 'KEY_VOLDOWN' : 'KEY_VOLUP').then(() => {
            console.log('setVolume then', value);
            callback();
        })
        .catch(error => {
            console.log('setVolume catch', error.message);
            callback(error);
        });
    }
}