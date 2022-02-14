let fetch         = require('node-fetch');

module.exports = class SmartThings {
    constructor(device) {
        this.device = device;
        this.api_key = device.config.api_key;
        this.device_id = device.config.device_id;

        if (!this.api_key || !this.device_id)
            return;

        this.api_base    = 'https://api.smartthings.com/v1';
        this.api_devices = this.api_base + '/devices/'
        this.api_device  = this.api_devices + this.device_id;
        this.api_status  = this.api_device + '/status';
        this.api_command = this.api_device + '/commands';
        this.api_headers = {'Authorization': 'Bearer ' + this.api_key};

        // Emit init event
        setTimeout(() => this.device.emit('smartthings.init'));
    }

    getStatus() {
        return this._send(this.api_status);
    }

    getInputSource() {
        return this.getStatus()
            .then(response => response.components.main.mediaInputSource.inputSource);
    }

    setInputSource(value) {
        return this.sendCommands([{
            component: 'main',
            capability: 'mediaInputSource',
            command: 'setInputSource',
            arguments: [value]
        }]);
    }

    setPictureMode(value) {
        return this.sendCommands([{
            component: "main",
            capability: "custom.picturemode",
            command: "setPictureMode",
            arguments: [value]
        }]);
    }

    sendCommands(commands) {
        return this._send(this.api_command, {
            commands: commands
        }, 'post');
    }

    _send(endpoint, data, method) {
        this._validate();

        // Log action
        this.device.log.debug(endpoint, data);

        return new Promise((resolve, reject) => {
            fetch(endpoint, {
                method: method || 'get',
                body: JSON.stringify(data),
                headers: this.api_headers
            })
            .then(response => {
                const contentType = response.headers.get('content-type');

                if (!contentType || !contentType.includes('application/json')) {
                    throw new Error(`${response.status} - ${response.statusText}`);
                }

                return response.json();
             })
             .then(response => {
                if (response.error) {
                    reject(response.error);
                }

                resolve(response);
            })
            .catch(error => reject(error));
        });
    }

    _validate() {
        if (this.api_key && this.device_id) return;

        throw new Error('Set api_key and device_id');
    }
}