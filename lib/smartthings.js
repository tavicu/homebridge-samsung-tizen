let fetch = require('node-fetch');
let utils = require('./utils');

const {
    SmartThingsNotSet,
    SmartThingsResponse
} = require('./errors');

module.exports = class SmartThings {
    constructor(device) {
        this.device = device;
        this.api_key = device.config.api_key;
        this.device_id = device.config.device_id;

        if (!this.api_key || !this.device_id)
            return;

        this.available   = true;

        this.api_base    = 'https://api.smartthings.com/v1';
        this.api_devices = this.api_base + '/devices/'
        this.api_device  = this.api_devices + this.device_id;
        this.api_status  = this.api_device + '/states';
        this.api_command = this.api_device + '/commands';
        this.api_switch  = this.api_device + '/components/main/capabilities/switch/status';
        this.api_headers = { 'Authorization': 'Bearer ' + this.api_key };

        // Emit init event
        setTimeout(() => this.device.emit('smartthings.init'));
    }

    /**
     * Retrieves the status of the device.
     * @returns {Promise<Object>} A promise that resolves to an object containing the device status.
     */
    getStatus() {
        return this.device.cache.get(`st-status`, () => this.refresh()
            .then(() => this._send(this.api_status))
            .catch(() => ({})
            ), 2500).then(response => ({
                pictureMode: response.main.pictureMode,
                tvChannel: response.main.tvChannel,
                tvChannelName: response.main.tvChannelName,
                inputSource: response.main.inputSource
            }));
    }

    getPictureMode() {
        return this.getStatus().then(response => response.pictureMode);
    }

    /**
     * Retrieves the current input source of the TV.
     * @returns {Promise<string>} A promise that resolves with the input source of the TV.
     */
    getInputSource() {
        return this.getStatus().then(response => {
            // Some TVs report inputSource as dtv, transform it to digitalTv
            if (response.inputSource.value == 'dtv') {
                response.inputSource.value = 'digitalTv';
            }

            // It's an application
            if (response.tvChannelName.value.includes('.')) return;

            // digitalTv should have valid channel
            if (!response.tvChannel.value && response.inputSource.value == 'digitalTv') return;

            return response.inputSource;
        });
    }

    /**
     * Fetches the current state of the switch capability from the SmartThings API.
     * Returns a boolean if successful, or null if an error occurs.
     * @returns {Promise<boolean|null>}
     */
    getSwitchState() {
        return this._send(this.api_switch)
            .then(response => {
                // Check the response for the switch state
                if (response && response.switch && typeof response.switch.value === 'string') {
                    this.device.log.debug(`Switch state fetched: ${response.switch.value}`);
                    // Return true if 'on', otherwise false
                    return response.switch.value === 'on';
                }
                // If response structure is not as expected, log and return null
                throw new SmartThingsResponse('Unexpected response structure when fetching switch (power) state');
            })
            .catch(error => {
                // Log any errors and return null
                this.device.log.debug(`Error fetching switch state: ${error}`);
                return new Promise(null);
            });
    }

    /**
     * Refreshes the main component's capability.
     * @returns {Promise} A promise that resolves when the refresh command is sent.
     */
    refresh() {
        return this.sendCommands({ component: 'main', capability: 'refresh', command: 'refresh' });
    }

    /**
     * Sets the input source for the device.
     *
     * @param {string} value - The input source value to set.
     * @returns {Promise} A promise that resolves when the input source is set successfully.
     */
    setInputSource(value) {
        // Try to set input source with Samsung-specific vendor extended capability (used in e.g. smart monitors)
        return this.sendCommands({ component: 'main', capability: 'samsungvd.mediaInputSource', command: 'setInputSource', arguments: [value] })
            .catch((error) => {
                // Catch errors (422) potentially due to unsupported capability and fallback to standard capability (used in most Samsung TVs)
                this.device.log.debug('Failed to set input source with Samsung-specific vendor extended capability, falling back to standard capability.', error);
                return this.sendCommands({ component: 'main', capability: 'mediaInputSource', command: 'setInputSource', arguments: [value] });
            });
    }

    /**
     * Sets the picture mode of the device.
     *
     * @param {string} value - The value representing the picture mode.
     * @returns {Promise} A promise that resolves when the command is sent successfully.
     */
    setPictureMode(value) {
        return this.sendCommands({ component: 'main', capability: 'custom.picturemode', command: 'setPictureMode', arguments: [value] });
    }

    /**
     * Sets the TV channel.
     *
     * @param {string} value - The channel value to set.
     * @returns {Promise} A promise that resolves when the command is sent.
     */
    setTvChannel(value) {
        return this.sendCommands({ component: 'main', capability: 'tvChannel', command: 'setTvChannel', arguments: [value + ''] });
    }

    /**
     * Sets the volume of the audio.
     *
     * @param {number} value - The volume value to set.
     * @returns {Promise} A promise that resolves when the volume is set.
     */
    setVolume(value) {
        return this.sendCommands({ component: 'main', capability: 'audioVolume', command: 'setVolume', arguments: [parseInt(value)] });
    }

    /**
     * Sends commands to the SmartThings API.
     * @param {Array|Object} commands - The commands to send. Can be an array of commands or a single command object.
     * @returns {Promise} A promise that resolves with the response from the API.
     */
    sendCommands(commands) {
        if (!Array.isArray(commands)) {
            commands = [commands];
        }

        return this._send(this.api_command, {
            commands: commands
        }, 'post');
    }

    /**
     * Sends a request to the specified endpoint with the provided data using the specified HTTP method.
     * @param {string} endpoint - The URL endpoint to send the request to.
     * @param {object} data - The data to send in the request body (optional).
     * @param {string} method - The HTTP method to use for the request (optional, defaults to 'get').
     * @returns {Promise<object>} - A promise that resolves with the response data or rejects with an error.
     */
    _send(endpoint, data, method) {
        this._validate();

        // Log action
        this.device.log.debug(endpoint, data ? JSON.stringify(data) : '');

        return new Promise((resolve, reject) => {
            fetch(endpoint, {
                method: method || 'get',
                body: JSON.stringify(data),
                headers: this.api_headers
            })
                .then(response => {
                    const contentType = response.headers.get('content-type');

                    if (!contentType || !contentType.includes('application/json')) {
                        throw new SmartThingsResponse(`${response.status} - ${response.statusText}`);
                    }

                    return response.json();
                })
                .then(response => {
                    this.device.log.debug(JSON.stringify(response));

                    if (response.error) {
                        reject(response.error);
                    }

                    resolve(response);
                })
                .catch(error => reject(error));
        });
    }

    /**
     * Validates the API key and device ID are set.
     * @throws {SmartThingsNotSet} If the API key or device ID is not set.
     */
    _validate() {
        if (this.api_key && this.device_id) return;

        throw new SmartThingsNotSet();
    }
}