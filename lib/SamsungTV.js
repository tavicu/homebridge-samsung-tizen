let Service, Characteristic;
let SamsungRemote = require('./SamsungRemote.js');

module.exports = (homebridge) => {
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;

    homebridge.registerAccessory('homebridge-samsung-tv', 'SamsungTV', SamsungTV);
}


class SamsungTV {
    /**
     * Constructor
     *
     * @param  {Function} log
     * @param  {Object} config
     */
    constructor(log, config) {
        this.log     = log;
        this.config  = config;
        this.type    = config['type'] || 'power';
        this.command = config['command'];
        this.channel = config["channel"];

        if (!config.ip) throw new Error('TV IP address is required');
        if (!config.mac) throw new Error('TV MAC address is required');

        this.TV      = new SamsungRemote(config);
        this.service = new Service.Switch(this.TV.name);

        // Mute switch
        if (this.type == 'mute') {
            this.service.getCharacteristic(Characteristic.On)
                .on('get', this._getMute.bind(this))
                .on('set', this._setMute.bind(this));

        // Command switch
        } else if (this.type == 'command') {
            this.service.getCharacteristic(Characteristic.On)
                .on('get', this._getCommand.bind(this))
                .on('set', this._setCommand.bind(this));

        // Channel switch
        } else if (this.type == 'channel') {
            this.service.getCharacteristic(Characteristic.On)
                .on('get', this._getChannel.bind(this))
                .on('set', this._setChannel.bind(this));

        // Default type, Power
        } else {
            this.service.getCharacteristic(Characteristic.On)
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
        return new Service.AccessoryInformation()
            .setCharacteristic(Characteristic.Name, this.TV.name)
            .setCharacteristic(Characteristic.Manufacturer, 'Samsung TV')
            .setCharacteristic(Characteristic.Model, 'Tizen')
            .setCharacteristic(Characteristic.SerialNumber, this.TV.ip);
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
        let status = await this.TV.isOn();

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
                response = await this.TV.turnOn();
            } else {
                response = await this.TV.turnOff();
            }
        }
        catch (error) {
            response = error;

            setTimeout(() => this.service.getCharacteristic(Characteristic.On).updateValue(!value), 50);
        }
        finally {
            // Log response
            this.log(`Power: ${response}`);

            // Run callback
            callback();
        }
    }

    /**
     * Get Mute
     *
     * @param  {Function} callback
     */
    _getMute(callback) {
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
            response = await this.TV.sendCmd('KEY_MUTE');
        }
        catch (error) {
            response = error;
        }
        finally {
            // Turn the switch back to OFF
            setTimeout(() => this.service.getCharacteristic(Characteristic.On).updateValue(false), 50);

            // Log response
            this.log(`Mute: ${response}`);

            // Run callback
            callback();
        }
    }

    /**
     * Get Command
     *
     * @param  {Function} callback
     */
    _getCommand(callback) {
        callback(null, false);
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
            response = await this.TV.sendCmd(this.command);
        }
        catch (error) {
            response = error;
        }
        finally {
            // Turn the switch back to OFF
            setTimeout(() => this.service.getCharacteristic(Characteristic.On).updateValue(false), 50);

            // Log response
            this.log(`Command: ${response}`);

            // Run callback
            callback();
        }
    }

    /**
     * Get Channel
     *
     * @param  {Function} callback
     */
    _getChannel(callback) {
        callback(null, false);
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
            response = await this.TV.setChannel(this.channel);
        }
        catch (error) {
            response = error;
        }
        finally {
            // Turn the switch back to OFF
            setTimeout(() => this.service.getCharacteristic(Characteristic.On).updateValue(false), 50);

            // Log response
            this.log(`Channel: ${response}`);

            // Run callback
            callback();
        }
    }
}