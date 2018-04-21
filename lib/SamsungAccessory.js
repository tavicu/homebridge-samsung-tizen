module.exports = class SamsungAccessory {
    /**
     * Constructor
     * @param  {Function} log
     * @param  {Object}   hap
     * @param  {Object}   device
     * @param  {Object}   remote
     */
    constructor(log, hap, device, remote) {
        this.log     = log;
        this.hap     = hap;
        this.name    = device['name'];
        this.type    = device['type'] || 'power';
        this.command = device['command'];
        this.channel = device['channel'];
        this.remote  = remote;

        // Create the service as Switch
        this.service = new this.hap.Service.Switch(this.name);

        // Mute switch
        if (this.type == 'mute') {
            this.service.getCharacteristic(this.hap.Characteristic.On)
                .on('get', this._getOffState.bind(this))
                .on('set', this._setMute.bind(this));

        // Command switch
        } else if (this.type == 'command' && this.command) {
            this.service.getCharacteristic(this.hap.Characteristic.On)
                .on('get', this._getOffState.bind(this))
                .on('set', this._setCommand.bind(this));

        // Channel switch
        } else if (this.type == 'channel' && this.channel) {
            this.service.getCharacteristic(this.hap.Characteristic.On)
                .on('get', this._getOffState.bind(this))
                .on('set', this._setChannel.bind(this));

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

            setTimeout(() => this.service.getCharacteristic(this.hap.Characteristic.On).updateValue(!value), 50);
        }
        finally {
            // Log response
            this.log(`Power: ${response}`);

            // Run callback
            callback();
        }
    }

    /**
     * Because we can't get the real value
     * we will always return false
     *
     * @param  {Function} callback
     */
    _getOffState(callback) {
        callback(null, false);
    }

    /**
     * Set Mute
     *
     * @param {Boolean}  value
     * @param {Function} callback
     */
    async _setMute(value, callback) {
        let response;

        try {
            response = await this.remote.sendCmd('KEY_MUTE');
        }
        catch (error) {
            response = error;
        }
        finally {
            // Turn the switch back to OFF
            setTimeout(() => this.service.getCharacteristic(this.hap.Characteristic.On).updateValue(false), 100);

            // Log response
            this.log(`Mute: ${response}`);

            // Run callback
            callback();
        }
    }

    /**
     * Set Command
     *
     * @param {Boolean}  value
     * @param {Function} callback
     */
    async _setCommand(value, callback) {
        let response;

        try {
            response = await this.remote.sendCmd(this.command);
        }
        catch (error) {
            response = error;
        }
        finally {
            // Turn the switch back to OFF
            setTimeout(() => this.service.getCharacteristic(this.hap.Characteristic.On).updateValue(false), 100);

            // Log response
            this.log(`Command: ${response}`);

            // Run callback
            callback();
        }
    }

    /**
     * Set Channel
     *
     * @param {Boolean}  value
     * @param {Function} callback
     */
    async _setChannel(value, callback) {
        let response;

        try {
            response = await this.remote.setChannel(this.channel);
        }
        catch (error) {
            response = error;
        }
        finally {
            // Turn the switch back to OFF
            setTimeout(() => this.service.getCharacteristic(this.hap.Characteristic.On).updateValue(false), 100);

            // Log response
            this.log(`Channel: ${response}`);

            // Run callback
            callback();
        }
    }
}