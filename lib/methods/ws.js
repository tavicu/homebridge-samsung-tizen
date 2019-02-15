let ws      = require('ws');
let request = require('request');
let Base    = require('./base');

const SOCKET_TIMEOUT = 1000 * 60 * 3;

module.exports = class WebSocket extends Base {
    constructor(device) {
        super(device);

        this.port   = device.config.port || 8001;
        this.remote = `ws://${this.ip}:${this.port}/api/v2/channels/samsung.remote.control?name=${this._encodeName()}`;
    }

    clickKey(key) {
        return this._send({
            method : 'ms.remote.control',
            params : {
                Cmd          : 'Click',
                DataOfCmd    : key,
                Option       : false,
                TypeOfRemote : 'SendRemoteKey'
            }
        });
    }

    async openApplication(appId) {
        if (!this.applications) {
            await this.getApplications();
        }

        let application = this.applications.find(element => element.appId == appId);

        if (!application) {
            throw new Error('no app');
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
                } catch (error) {
                    reject(new Error('fail get app'));
                }
            });
        });
    }

    async getApplications() {
        if (this.applications) {
            return this.applications;
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

        return this.applications;
    }

    close() {
        this._closeSocket();
    }



    async _send(data) {
        await this._checkSocket();

        await new Promise((resolve, reject) => this.socket.send(JSON.stringify(data), error => {
            if (error) {
                reject(new Error('asgaga'));
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

        await this._openSocket();
    }

    _openSocket(url) {
        return new Promise((resolve, reject) => {
            this.socket = new ws(url || this.remote, {
                handshakeTimeout: 500,
                rejectUnauthorized: false
            })
            .on('error', error => {
                reject(new Error(error));
            })
            .on('close', () => {
                clearTimeout(this.socket.timeout);
                this.socket = null;
            })
            .on('message', response => {
                response = JSON.parse(response);

                console.log('message', response);

                if (response.event === 'ms.channel.connect') {
                    resolve(response.data.token);

                    if (response.data.token) {
                        this.token = response.data.token;

                        this.storage.set(this.device.uuid, this.token);
                    }

                    this.socket.timeout = setTimeout(() => this._closeSocket(), SOCKET_TIMEOUT);
                } else if (response.event === 'ed.installedApp.get') {
                    this.applications = response.data.data;
                } else {
                    console.log('failed');
                    reject(new Error("Whoops!"));
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