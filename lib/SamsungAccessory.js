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
        this.sources = device.config['sources'] || [];

	this.services = [];

        this.switch  = {
            app     : device.config['app'],
            mute    : device.config['mute'],
            power   : device.config['power'],
            sleep   : device.config['sleep'],
            command : device.config['command'],
            channel : device.config['channel']
        }

	if (this.type == 'switch') {
	        this.service        = new this.hap.Service.Switch(this.name);
        	this.characteristic = this.service.getCharacteristic(this.hap.Characteristic.On);
	
	        this.characteristic
        	    .on('get', this._getSwitch.bind(this))
           	    .on('set', this._setSwitch.bind(this));

		this.services.push(this.service);
	}
	else {
	        this.service        = new this.hap.Service.Television(this.name, "Television");
		this.characteristic = this.service.getCharacteristic(this.hap.Characteristic.Active);
	

		this.service.setCharacteristic(this.hap.Characteristic.ConfiguredName, this.name);
		this.service.setCharacteristic(this.hap.Characteristic.SleepDiscoveryMode, this.hap.Characteristic.SleepDiscoveryMode.ALWAYS_DISCOVERABLE);
		this.service.getCharacteristic(this.hap.Characteristic.Active)
		    .on('get', this._getOn.bind(this))
		    .on('set', this._setOn.bind(this));

		this.service.getCharacteristic(this.hap.Characteristic.RemoteKey)
		    .on('set', this._setRemoteKey.bind(this));


		this.service.setCharacteristic(this.hap.Characteristic.ActiveIdentifier, 0);
		this.service.getCharacteristic(this.hap.Characteristic.ActiveIdentifier)
		    .on('set', this._setInput.bind(this));




                let speakerService = new this.hap.Service.TelevisionSpeaker(this.name + " Volume", "volumeService");
                speakerService
                        .setCharacteristic(this.hap.Characteristic.Active, this.hap.Characteristic.Active.ACTIVE)
                        .setCharacteristic(this.hap.Characteristic.VolumeControlType, this.hap.Characteristic.VolumeControlType.ABSOLUTE);

                speakerService
                        .getCharacteristic(this.hap.Characteristic.VolumeSelector)
                        .on('set', this._setVolume.bind(this));

                this.service.addLinkedService(speakerService);


                this.services.push(speakerService);
	}
            this.sources.forEach((source, i) => {
                let input = new this.hap.Service.InputSource(source.name, 'source_' + i)
                    .setCharacteristic(this.hap.Characteristic.Identifier, i)
                    .setCharacteristic(this.hap.Characteristic.ConfiguredName, source.name)
                    .setCharacteristic(this.hap.Characteristic.IsConfigured, this.hap.Characteristic.IsConfigured.CONFIGURED)
                    .setCharacteristic(this.hap.Characteristic.InputSourceType, this.hap.Characteristic.InputSourceType.APPLICATION)
                    .setCharacteristic(this.hap.Characteristic.CurrentVisibilityState, this.hap.Characteristic.CurrentVisibilityState.SHOWN);

                this.service.addLinkedService(input);
                this.services.push(input);
            });
    
            this.services.unshift(this.service);
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
        return this.services.concat([this.getInformationService()]);
    }


    async _setInput(value, callback) {
        try {
            let status = await this.remote.isOn();

            if (!status) {
                    throw 'Can\'t reach TV';
            }

            let source = this.sources[value];

            if (source.command) {
                let response = await this.remote.sendCmd(source.command);
                this.log(`Remote key: ${value}, ${response}`);
            }

            if (source.app) {
                let response = await this.remote.openApp(source.app);
                this.log(`Remote key: ${value}, ${response}`);
            }
        }
        catch (error) {
                this.log(`Error: ${error}`);
        }
        finally {
                callback();
        }
    }


    async _setRemoteKey(value, callback) {
        let map = {
	    [this.hap.Characteristic.RemoteKey.REWIND]:		'KEY_REWIND',
	    [this.hap.Characteristic.RemoteKey.FAST_FORWARD]:	'KEY_FF',
	    [this.hap.Characteristic.RemoteKey.ARROW_UP]: 	'KEY_UP',
	    [this.hap.Characteristic.RemoteKey.ARROW_RIGHT]: 	'KEY_RIGHT',
	    [this.hap.Characteristic.RemoteKey.ARROW_DOWN]:	'KEY_DOWN',
            [this.hap.Characteristic.RemoteKey.ARROW_LEFT]:	'KEY_LEFT',
	    [this.hap.Characteristic.RemoteKey.SELECT]: 	'KEY_ENTER',
	    [this.hap.Characteristic.RemoteKey.PLAY_PAUSE]:	'KEY_PLAY',
	    [this.hap.Characteristic.RemoteKey.BACK]:		'KEY_RETURN',
	    [this.hap.Characteristic.RemoteKey.EXIT]:		'KEY_HOME',
	    [this.hap.Characteristic.RemoteKey.INFORMATION]:	'KEY_TOOLS'
	} 

	try {
		let status = await this.remote.isOn();

		if (!status) {
			throw 'Can\'t reach TV';
		}


		if (map[value]) {
			let response = await this.remote.sendCmd(map[value]);
			this.log(`Remote key: ${value}, ${response}`);
		}
	}
	catch (error) {
		this.log(`Error: ${error}`);
	}
	finally {
		callback();
	}
    }



    async _setVolume(value, callback) {
        let map = {
            [this.hap.Characteristic.VolumeSelector.INCREMENT]:   'KEY_VOLUP',
            [this.hap.Characteristic.VolumeSelector.DECREMENT]:   'KEY_VOLDOWN',
        }

        try {
                let status = await this.remote.isOn();

                if (!status) {
                        throw 'Can\'t reach TV';
                }


                if (map[value]) {
                        let response = await this.remote.sendCmd(map[value]);
                        this.log(`Remote key: ${value}, ${response}`);
                }
        }
        catch (error) {
                this.log(`Error: ${error}`);
        }
        finally {
                callback();
        }
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
            if (this.switch.app) {
                if (value) {
                    // If we run a previous command add a delay
                    if (this.switch.mute || this.switch.channel) {
                        await this._delay(400);
                    }

                    response = await this.remote.openApp(this.switch.app);

                    // Log response
                    this.log(`Application: ${response}`);
                } else {
                    // Can't switch off an application
                    setTimeout(() => this.characteristic.updateValue(true), 100);
                }
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
