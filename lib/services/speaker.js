module.exports = class Speaker {
    constructor(accessory) {
        this.hap      = accessory.hap;
        this.remote   = accessory.remote;
        this.name     = accessory.name + ' Volume';

        this.createService();
    }

    createService() {
        this.service  =  new this.hap.Service.TelevisionSpeaker(this.name)
            .setCharacteristic(this.hap.Characteristic.VolumeControlType, this.hap.Characteristic.VolumeControlType.ABSOLUTE);

        this.service.getCharacteristic(this.hap.Characteristic.VolumeSelector)
            .on('set', this.setVolume.bind(this));
    }

    setVolume(value, callback) {
        this.remote.command(value ? 'KEY_VOLDOWN' : 'KEY_VOLUP').then(() => {
            console.log('setVolume then', value);
            callback();
        })
        .catch(error => {
            console.log('setVolume catch', error.message);
            callback(error);
        });
    }
}