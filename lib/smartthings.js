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
        this.api_headers = {'Authorization': 'Bearer ' + this.api_key};

        // Emit init event
        setTimeout(() => this.device.emit('smartthings.init'));
    }

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

    refresh() {
        return this.sendCommands({component: 'main', capability: 'refresh', command: 'refresh'});
    }

    setInputSource(value) {
        return this.sendCommands({component: 'main', capability: 'mediaInputSource', command: 'setInputSource', arguments: [value]});
    }

    setPictureMode(value) {
        return this.sendCommands({component: 'main', capability: 'custom.picturemode', command: 'setPictureMode', arguments: [value]});
    }

    setTvChannel(value) {
        return this.sendCommands({component: 'main', capability: 'tvChannel', command: 'setTvChannel', arguments: [value + '']});
    }

    setVolume(value) {
        return this.sendCommands({component: 'main', capability: 'audioVolume', command: 'setVolume', arguments: [parseInt(value)]});
    }

    sendCommands(commands) {
        if (!Array.isArray(commands)) {
            commands = [commands];
        }

        return this._send(this.api_command, {
            commands: commands
        }, 'post');
    }

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

    _validate() {
        if (this.api_key && this.device_id) return;

        throw new SmartThingsNotSet();
    }
}