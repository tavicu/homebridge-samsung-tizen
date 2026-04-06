import { HAP, CharacteristicValue } from 'homebridge';

let hap: HAP;

export class TelevisionService {
    public device;
    public service;

    constructor(public accessory) {
        const { device, platform } = accessory;
        hap = platform.api.hap;

        this.device = device;

        // TODO
        // this.remoteKeys = require('../options/remote')(this.device, Hap);

        this.createService();
    }

    private createService() {
        const displayOrder = this.accessory.inputs.map((input: any) => input.config.identifier);

        this.service = new hap.Service.Television(this.device.config.name)
            .setCharacteristic(hap.Characteristic.ConfiguredName, this.device.config.name)
            .setCharacteristic(hap.Characteristic.DisplayOrder, hap.encode(1, displayOrder).toString('base64'))
            .setCharacteristic(hap.Characteristic.SleepDiscoveryMode, hap.Characteristic.SleepDiscoveryMode.ALWAYS_DISCOVERABLE);

        this.service.getCharacteristic(hap.Characteristic.Active).onGet(this.getActive.bind(this)).onSet(this.setActive.bind(this));

        // this.service.getCharacteristic(hap.Characteristic.RemoteKey).on(CharacteristicEventTypes.SET, this.setRemote.bind(this));

        // this.service
        //     .getCharacteristic(hap.Characteristic.ActiveIdentifier)
        //     .on(CharacteristicEventTypes.GET, this.getInput.bind(this))
        //     .on(CharacteristicEventTypes.SET, this.setInput.bind(this));
    }

    addLinkedService(newLinkedService) {
        return this.service.addLinkedService(newLinkedService);
    }

    public async updateValue() {
        const value = await this.getActive();

        this.service.getCharacteristic(hap.Characteristic.Active).updateValue(value);
    }

    // TODO
    private async getActive(): Promise<CharacteristicValue> {
        // this.device.remote.getMain().then((status) => {
        //     callback(null, status);
        // });

        return this.device.state.Power;
    }

    // TODO
    private async setActive(value: CharacteristicValue) {
        this.device.state.Power = value as boolean;

        // utils
        //     .race(this.device.remote.setMain(value))
        //     .then(() => {
        //         callback();
        //     })
        //     .catch((error) => {
        //         this.device.log.error(error.message);
        //         this.device.log.debug(error.stack);
        //         callback(error);
        //     });
    }

    // TODO
    // private setRemote(value: CharacteristicValue, callback: CharacteristicGetCallback) {
    //     // utils.race(this.device.remote.command(this.remoteKeys[value])).then(() => {
    //     //     callback();
    //     // })
    //     // .catch(error => {
    //     //     this.device.log.error(error.message);
    //     //     this.device.log.debug(error.stack);
    //     //     callback(error);
    //     // });
    // }

    // private getInput(callback: CharacteristicGetCallback) {
    //     callback(null, 0);
    //     // callback(null, this.service.getCharacteristic(Hap.Characteristic.ActiveIdentifier).value || 0);
    //     // this.device.remote.getMain().then(async (status) => {
    //     //     if (!status) { return; }
    //     //     for (let input of this.accessory.inputs) {
    //     //         let value = await input.getInput();
    //     //         if (value) {
    //     //             return input;
    //     //         }
    //     //     }
    //     // })
    //     // .then(input => {
    //     //     this.updateValue(input ? input.config.identifier : 0, Hap.Characteristic.ActiveIdentifier);
    //     // })
    //     // .catch(error => {
    //     //     this.device.log.debug(error.stack);
    //     // });
    // }

    // private setInput(value: CharacteristicValue, callback: CharacteristicGetCallback) {
    //     // new Promise(resolve => resolve(this.accessory.inputs.find(input => input.config.identifier == value)))
    //     // .then(input => input.setInput())
    //     // .then(input => {
    //     //     if (input.stateless) {
    //     //         setTimeout(() => this.updateValue(0, Hap.Characteristic.ActiveIdentifier), 150);
    //     //     }
    //     //     callback();
    //     // })
    //     // .catch(error => {
    //     //     this.device.log.error(error.message);
    //     //     this.device.log.debug(error.stack || error.details);
    //     //     setTimeout(() => this.updateValue(0, Hap.Characteristic.ActiveIdentifier), 150);
    //     //     callback();
    //     // });
    // }
}
