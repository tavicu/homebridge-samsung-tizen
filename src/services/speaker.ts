import { HAP, CharacteristicEventTypes, CharacteristicValue, CharacteristicGetCallback } from 'homebridge';

export class SpeakerService {
    public device;
    public service;

    constructor(public accessory) {
        const { device, platform } = accessory;
        const hap: HAP = platform.api.hap;

        this.device = device;

        this.service = new hap.Service.TelevisionSpeaker(device.config.name + ' Volume').setCharacteristic(
            hap.Characteristic.VolumeControlType,
            hap.Characteristic.VolumeControlType.ABSOLUTE,
        );

        this.service.getCharacteristic(hap.Characteristic.Mute).on(CharacteristicEventTypes.SET, this.setMute.bind(this));
        this.service.getCharacteristic(hap.Characteristic.VolumeSelector).on(CharacteristicEventTypes.SET, this.setVolume.bind(this));

        this.service.linked = true;
    }

    // TODO
    setMute(value: CharacteristicValue, callback: CharacteristicGetCallback) {
        // this.device.remote.command('KEY_MUTE').then(() => {
        //     callback();
        // })
        // .catch(error => {
        //     this.device.log.debug(error.stack);
        //     callback();
        // });
    }

    // TODO
    setVolume(value: CharacteristicValue, callback: CharacteristicGetCallback) {
        // this.device.remote.command(value ? 'KEY_VOLDOWN' : 'KEY_VOLUP').then(() => {
        //     callback();
        // })
        // .catch(error => {
        //     this.device.log.debug(error.stack);
        //     callback();
        // });
    }
}
