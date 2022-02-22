let ws              = require('ws');
let utils           = require('../utils');
let Base            = require('./base');

const {
    TvOfflineError,

    SocketOpenError,
    SocketSendError,
    SocketResponseError
} = require('../errors');

const HEARTBEAT_TIMEOUT = 8 * 1000; // 8 seconds (6 ping + 2 for safety)

module.exports = class WebSocket extends Base {
    constructor(device) {
        super(device);

        this.port = device.config.port || 8001;
        this.url  = `ws://${this.ip}:${this.port}/api/v2/channels/samsung.remote.control?name=${this._encodeName()}`;

        this.device.on('destroy', () => this.destroy());
    }

    destroy() {
        super.destroy();
        this._close();
    }

    click(key, cmd) {
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

    async hold(key, time) {
        await this.click(key, 'Press');
        await utils.delay(time);
        await this.click(key, 'Release');
    }

    async _send(data) {
        this.device.log.debug(data);

        // Check socket
        await this._check();

        // Stop heartbeat while sending
        clearTimeout(this.heartbeat);

        await new Promise((resolve, reject) => this.socket.send(JSON.stringify(data), error => {
            if (error) {
                reject(new SocketSendError(error.message));
            }

            resolve();
        }));
    }

    async _check() {
        if (this.destroyed) {
            return Promise.resolve();
        }

        if (this.socket) {
            if (this.socket.readyState == ws.OPEN) {
                return Promise.resolve();
            }

            if (this.socket.readyState == ws.CONNECTING) {
                return new Promise(resolve => setTimeout(() => resolve(this._check()), 150));
            }
        }

        try {
            await this._open();
            await utils.delay(150);
        } catch(error) {
            throw new SocketOpenError(error.message);
        }
    }

    _open(url) {
        return new Promise((resolve, reject) => {
            this.socket = new ws(url || this.url, {
                servername: '',
                handshakeTimeout: 500,
                rejectUnauthorized: false
            })
            .on('error', error => reject(new SocketOpenError(error.message)))
            .on('ping', () => this._heartbeat())
            .on('message', response => {
                response = JSON.parse(response);

                this.device.log.debug(response);

                if (response.event === 'ms.channel.connect') {
                    resolve();

                    if (response.data.token) {
                        this.token = response.data.token;
                        this.device.storage.token = this.token;
                    }
                } else if (response.event === 'ms.error') {
                    this.device.log.debug((new SocketResponseError(response.data.message)).stack);
                } else {
                    reject(new SocketOpenError(null, response));
                }
            });
        });
    }

    _close() {
        if (this.socket) {
            this.socket.terminate();
        }
    }

    _heartbeat() {
        clearTimeout(this.heartbeat);

        this.heartbeat = setTimeout(() => this._close(), HEARTBEAT_TIMEOUT);
    }
}