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
        this.api_status  = this.api_device + '/states';
        this.api_command = this.api_device + '/commands';
        this.api_headers = {'Authorization': 'Bearer ' + this.api_key};

        // Emit init event
        setTimeout(() => this.device.emit('smartthings.init'));
    }

    setInputSource(value) {
        if (!this.api_command) return;

        return this._post(this.api_command, {
            commands: [
                {
                    component: 'main',
                    capability: 'mediaInputSource',
                    command: 'setInputSource',
                    arguments: [value]
                }
            ]
        });
    }

    _get(endpoint, data) {
        if (!endpoint) return;

        return fetch(endpoint, {
            body: JSON.stringify(data),
            headers: this.api_headers
        })
        .then(body => body.json());
    }

    _post(endpoint, data) {
        if (!endpoint) return;

        return fetch(endpoint, {
            method: 'post',
            body: JSON.stringify(data),
            headers: this.api_headers
        })
        .then(body => body.json());
    }
}