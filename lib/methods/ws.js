let ws              = require('ws');
let fetch           = require('node-fetch');
let isPortReachable = require('is-port-reachable');
let BaseMethod      = require('./base');

const {
    TvOfflineError,

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
        return new Promise((resolve, reject) => {
            fetch(`http://${this.ip}:8001/api/v2/applications/${appId}`, {
                method: 'post',
                timeout: this.timeout
            })
            .then(body => body.json())
            .then(data => {
                if (data && data.code == 404) {
                    reject(new InvalidAppIdError(null, appId));
                }

                resolve();
            })
            .catch(error => resolve());
        });
    }

    getApplication(appId) {
        return new Promise((resolve, reject) => {
            fetch(`http://${this.ip}:8001/api/v2/applications/${appId}`, {
                timeout: this.timeout
            })
            .then(body => body.json())
            .then(data => resolve(data || '{}'))
            .catch(error => resolve({}));
        });
    }

    async getApplications() {
        if (this.device.applications) {
            return this.device.applications;
        }

        if (!await this.isActive()) {
            throw new TvOfflineError('TV is offline! Can\'t get installed apps!');
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

        return this.device.applications || [];
    }

    getInfo() {
        return new Promise((resolve, reject) => {
            fetch(`http://${this.ip}:8001/api/v2/`, {
                timeout: this.timeout
            })
            .then(body => body.json())
            .then(data => resolve({
                frametv: data.device.FrameTVSupport == 'true',
                tokenauth: data.device.TokenAuthSupport == 'true'
            }))
            .catch(error => reject());
        });
    }

    close() {
        this._closeSocket();
    }

    async _send(data) {
        await this._checkSocket();
        this.device.log.debug(data);

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
            await this._delay(150);
        } catch(error) {
            throw new SocketOpenError(error.message);
        }
    }

    _openSocket(url) {
        return new Promise((resolve, reject) => {
            this.socket = new ws(url || this.remote, {
                servername: '',
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
                        this.device.storage.token = this.token;
                    }

                    this.socket.timeout = setTimeout(() => this._closeSocket(), SOCKET_TIMEOUT);
                } else if (response.event === 'ed.installedApp.get') {
                    this.device.applications = response.data.data;
                } else if (response.event === 'ms.error') {
                    this.device.log.debug((new SocketResponseError(response.data.message)).stack);
                } else {
                    reject(new SocketOpenError(null, response));
                }

                this.device.log.debug(response);
            });
        });
    }

    _closeSocket() {
        if (this.socket) {
            this.socket.close();
        }
    }
}