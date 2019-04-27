let ws              = require('ws');
let request         = require('request');
let isPortReachable = require('is-port-reachable');
let BaseMethod      = require('./base');

const {
    SocketOpenError,
    SocketSendError,
    SocketResponseError,

    InvalidAppIdError
} = require('../errors');

const SOCKET_TIMEOUT = 1000 * 60 * 3;

module.exports = class WebSocket extends BaseMethod {
    constructor(device) {
        super(device);

        this.port   = device.config.port || 8001;
        this.remote = `ws://${this.ip}:${this.port}/api/v2/channels/samsung.remote.control?name=${this._encodeName()}`;
    }

    isActive() {
        return new Promise(resolve => {
            isPortReachable(8001, {
                host: this.ip,
                timeout: this.timeout
            }).then(reachable => resolve(reachable));
        });
    }

    clickKey(key, cmd) {
        return this._send({
            method : 'ms.remote.control',
            params : {
                Cmd          : cmd || 'Click',
                DataOfCmd    : key,
                Option       : false,
                TypeOfRemote : 'SendRemoteKey'
            }
        });
    }

    async holdKey(key, time) {
        await this.clickKey(key, 'Press');
        await this._delay(time);
        await this.clickKey(key, 'Release');
    }

    async openApplication(appId) {
        let applications = await this.getApplications();
        let application  = applications.find(element => element.appId == appId);

        if (!application) {
            throw new InvalidAppIdError(null, appId);
        }

        return this._send({
            method : 'ms.channel.emit',
            params : {
                to    : 'host',
                event : 'ed.apps.launch',
                data  : {
                    action_type : application.app_type == 2 ? 'DEEP_LINK' : 'NATIVE_LAUNCH',
                    appId       : application.appId
                }
            }
        });
    }

    getApplication(appId) {
        return new Promise((resolve, reject) => {
            request.get(`http://${this.ip}:8001/api/v2/applications/${appId}`, {
                timeout: this.timeout
            }, (error, data, body) => {
                try {
                    resolve(JSON.parse(body || '{}'));
                } catch (error) { }

                resolve({});
            });
        });
    }

    async getApplications() {
        if (this.device.applications) {
            return this.device.applications;
        }

        await this._send({
            method : 'ms.channel.emit',
            params : {
                data  : '',
                to    : 'host',
                event : 'ed.installedApp.get'
            }
        });

        await this._delay(1000);

        return this.device.applications;
    }

    close() {
        this._closeSocket();
    }

    async _send(data) {
        await this._checkSocket();

        await new Promise((resolve, reject) => this.socket.send(JSON.stringify(data), error => {
            if (error) {
                reject(new SocketSendError(error.message));
            }

            resolve();
        }));
    }

    async _checkSocket() {
        if (this.socket && this.socket.OPEN) {
            clearTimeout(this.socket.timeout);
            this.socket.timeout = setTimeout(() => this._closeSocket(), SOCKET_TIMEOUT);

            return true;
        }

        try {
            await this._openSocket();
        } catch(error) {
            throw new SocketOpenError(error.message);
        }
    }

    _openSocket(url) {
        return new Promise((resolve, reject) => {
            this.socket = new ws(url || this.remote, {
                handshakeTimeout: 500,
                rejectUnauthorized: false
            })
            .on('error', error => {
                reject(new SocketOpenError(error.message));
            })
            .on('close', () => {
                this.socket = null;
            })
            .on('message', response => {
                response = JSON.parse(response);

                if (response.event === 'ms.channel.connect') {
                    resolve(response.data.token);

                    if (response.data.token) {
                        this.token = response.data.token;

                        this.platform.storage.setValue(this.device.uuid, 'token', this.token);
                    }

                    this.socket.timeout = setTimeout(() => this._closeSocket(), SOCKET_TIMEOUT);
                } else if (response.event === 'ed.installedApp.get') {
                    this.device.applications = response.data.data;
                } else if (response.event === 'ms.error') {
                    this.device.debug((new SocketResponseError(response.data.message)).stack);
                } else {
                    reject(new SocketOpenError(null, response));
                }
            });
        });
    }

    _closeSocket() {
        if (this.socket) {
            this.socket.close();
        }
    }
}