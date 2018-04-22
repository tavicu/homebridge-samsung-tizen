module.exports = class SamsungAccessory {
    /**
     * Constructor
     *
     * @param  {Object}   device
     * @param  {String}   type
     */
    constructor(device, type) {
        this.log     = device.log;
        this.hap     = device.hap;
        this.device  = device;
        this.remote  = device.remote;

        this.type    = type || 'power';
        this.name    = device.config['name'];

        this.switch  = {
            mute    : device.config['mute'],
            sleep   : device.config['sleep'],
            command : device.config['command'],
            channel : device.config['channel']
        }

        // Create the service as Switch
        this.service = new this.hap.Service.Switch(this.name);

        // Custom switch (Child)
        if (this.type == 'switch') {
            this.service.getCharacteristic(this.hap.Characteristic.On)
                .on('get', this._getSwitch.bind(this))
                .on('set', this._setSwitch.bind(this));

        // Default type, Power
        } else {
            this.service.getCharacteristic(this.hap.Characteristic.On)
                .on('get', this._getOn.bind(this))
                .on('set', this._setOn.bind(this));
        }
    }

    /**
     * Get accessory information
     *
     * @return {Service}
     */
    getInformationService() {
        return new this.hap.Service.AccessoryInformation()
            .setCharacteristic(this.hap.Characteristic.Name, this.remote.name)
            .setCharacteristic(this.hap.Characteristic.Manufacturer, 'Samsung TV')
            .setCharacteristic(this.hap.Characteristic.Model, 'Tizen')
            .setCharacteristic(this.hap.Characteristic.SerialNumber, this.remote.ip);
    }

    /**
     * Get accessory service
     *
     * @return {Array}
     */
    getServices() {
        return [this.service, this.getInformationService()];
    }

    /**
     * Get TV status
     *
     * @param  {Function} callback
     */
    async _getOn(callback) {
        let status = await this.remote.isOn();

        callback(null, status);
    }

    /**
     * Set TV status
     *
     * @param {Boolean}  value
     * @param {Function} callback
     */
    async _setOn(value, callback) {
        let response;

        // Send command
        try {
            if (value) {
                response = await this.remote.turnOn();
            } else {
                response = await this.remote.turnOff();
            }
        }
        catch (error) {
            response = error;

            setTimeout(() => this.service.getCharacteristic(this.hap.Characteristic.On).updateValue(!value), 100);
        }
        finally {
            // Log response
            this.log(`Power: ${response}`);

            // Run callback
            callback();
        }
    }

    /**
     * Get child switch status
     *
     * @param  {Function} callback
     */
    async _getSwitch(callback) {
        // If sleep time is set
        if (this.remote.sleep !== null) {
            let status = await this.remote.isOn();

            return callback(null, status);
        }

        // Else always false
        callback(null, false);
    }

    /**
     * Set child switch status
     *
     * @param {Boolean}  value
     * @param {Function} callback
     */
    async _setSwitch(value, callback) {
        let response;

        // Send commands
        try {
            if (this.switch.sleep) {
                response = await this.remote.setSleep(value ? this.switch.sleep : 0, () => {
                    console.log('callback');
                });

                // Log response
                this.log(`Sleep: ${response}`);
            }
        }
        catch (error) {

        }
        finally {
            // Run callback
            callback();
        }
    }
}