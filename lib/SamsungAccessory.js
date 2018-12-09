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
            app     : device.config['app'],
            mute    : device.config['mute'],
            power   : device.config['power'],
            sleep   : device.config['sleep'],
            command : device.config['command'],
            channel : device.config['channel']
        }

        // Create the service as Switch
        this.service        = new this.hap.Service.Switch(this.name);
        this.characteristic = this.service.getCharacteristic(this.hap.Characteristic.On);

        // Set characteristic handlers
        this.characteristic
            .on('get', this.type == 'switch' ? this._getSwitch.bind(this) : this._getOn.bind(this))
            .on('set', this.type == 'switch' ? this._setSwitch.bind(this) : this._setOn.bind(this));
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
     * Private: Get TV status
     *
     * @param  {Function} callback
     */
    async _getOn(callback) {
        let status = await this.remote.isOn();

        callback(null, status);
    }

    /**
     * Private: Set TV status
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

            setTimeout(() => this.characteristic.updateValue(!value), 100);
        }
        finally {
            // Log response
            this.log(`Power: ${response}`);

            // Run callback
            callback();
        }
    }

    /**
     * Private: Get child switch status
     *
     * @param  {Function} callback
     */
    async _getSwitch(callback) {
        // If sleep time is set
        if (this.switch.sleep && this.remote.sleep !== null) {
            let status = await this.remote.isOn();

            return callback(null, status);
        }

        // If app switch
        if (this.switch.app) {
            let status = await this.remote.getAppStatus(this.switch.app);

            return callback(null, status);
        }

        // Else always false
        callback(null, false);
    }

    /**
     * Private: Set child switch status
     *
     * @param {Boolean}  value
     * @param {Function} callback
     */
    async _setSwitch(value, callback) {
        let response;

        // Send commands
        try {
            let status = await this.remote.isOn();

            // Check if TV is OFF
            if (!status) {
                // Turn it ON before sending commands
                if (this.switch.power && value) {
                    response = await this.remote.turnOn();

                    // Log response
                    this.log(`Power: ${response}`);

                    // Update state for ON / OFF accessory (first in the list)
                    this.device.accessories[0].characteristic.updateValue(true);

                    // Delay
                    await this._delay(1500);
                }
                // Reject because the TV is OFF
                else {
                    throw 'Can\'t reach TV';
                }
            }

            // Sleep command
            if (this.switch.sleep) {
                response = await this.remote.setSleep(value ? this.switch.sleep : 0, (message) => {
                    // Log response
                    this.log(`Sleep: ${message}`);

                    // Update state for current accessory
                    this.characteristic.updateValue(false);

                    // Update state for ON / OFF accessory (first in the list)
                    this.device.accessories[0].characteristic.updateValue(false);
                });

                // Log response
                this.log(`Sleep: ${response}`);
            }

            // Mute command
            if (this.switch.mute && value) {
                response = await this.remote.sendCmd('KEY_MUTE');

                // Log response
                this.log(`Mute: ${response}`);
            }

            // Channel command
            if (this.switch.channel && value) {
                // If we run a previous command add a delay
                if (this.switch.mute) {
                    await this._delay(400);
                }

                response = await this.remote.setChannel(this.switch.channel);

                // Log response
                this.log(`Channel: ${response}`);
            }

            // App command
            if (this.switch.app && value) {
                // If we run a previous command add a delay
                if (this.switch.mute || this.switch.channel) {
                    await this._delay(400);
                }

                response = await this.remote.openApp(this.switch.app);

                // Log response
                this.log(`Application: ${response}`);
            }

            // Custom command
            if (this.switch.command && value) {
                // If we run a previous command add a delay
                if (this.switch.mute || this.switch.channel || this.switch.app) {
                    await this._delay(400);
                }

                response = await this.remote.sendCmd(this.switch.command);

                // Log response
                this.log(`Command: ${response}`);
            }

            // Switch the state back to off if staeless
            if (!this.switch.sleep && !this.switch.app) {
                setTimeout(() => this.characteristic.updateValue(!value), 100);
            }
        }
        catch (error) {
            this.log(`Error: ${error}`);

            setTimeout(() => this.characteristic.updateValue(!value), 100);
        }
        finally {
            // Run callback
            callback();
        }
    }

    /**
     * Private: Create a delay
     *
     * @param  {Number} ms
     * @return {Promise}
     */
    _delay(ms) {
        return new Promise(resolve => {
            setTimeout(resolve, ms);
        });
    }
}
