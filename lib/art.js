let ws = require('ws');

const {
    ArtSocketOpenError
} = require('./errors');

const HEARTBEAT_TIMEOUT = 8 * 1000; // 8 seconds (6 ping + 2 for safety)

module.exports = class Art {
    constructor(device) {
        this.data   = {};
        this.status = false;
        this.name   = device.config.name || 'SamsungTvArt';

        this.device = device;

        this.remote = `ws://${device.config.ip}:8001/api/v2/channels/com.samsung.art-app?name=${this._encodeName()}`;

        this.device.on('stopping', () => this.stopping = true);
    }

    getStatus() {
        this._check().catch(() => {});

        return Promise.resolve(this.status);
    }

    close() {
        if (this.socket) {
            this.socket.terminate();
        }
    }

    async _send(data) {
        await this._check();

        this.socket.send(JSON.stringify({
            method : 'ms.channel.emit',
            params : {
                data  : JSON.stringify(Object.assign({
                    id: this.data.id || 'noop-id'
                },data)),
                to    : 'host',
                event : 'art_app_request'
            }
        }));
    }

    async _check() {
        if (this.stopping) { return Promise.resolve(); }
        if (this.socket && this.socket.readyState == ws.OPEN) { return Promise.resolve(); }

        try {
            await this._open();
            await this._delay(150);
        } catch(error) {
            throw new ArtSocketOpenError(error.message);
        }
    }

    _open() {
        return new Promise((resolve, reject) => {
            this.socket = new ws(this.remote, {
                servername: '',
                handshakeTimeout: 500,
                rejectUnauthorized: false
            })
            .on('error', error => reject(new ArtSocketOpenError(error.message)))
            .on('ping', () => this._heartbeat())
            .on('message', response => {
                response = JSON.parse(response);

                if (response.event === 'ms.channel.connect') {
                    resolve(response.data);

                    this.data = response.data;

                } else if (response.event === 'ms.channel.ready') {

                    this._send({request: 'get_artmode_status'});

                } else if (response.event === 'd2d_service_message') {
                    let data = JSON.parse(response.data);

                    if (data.event === 'artmode_status') {
                        this.status = data.value === 'on';
                        this.device.emit('artmode.changed', data.value);

                    } else if (data.event === 'art_mode_changed') {
                        this.status = data.status === 'on';
                        this.device.emit('artmode.changed', data.status);

                    } else if (data.event === 'go_to_standby') {
                        this.status = false;
                        this.device.emit('artmode.changed', 'standby');

                    } else if (data.event === 'wakeup') {
                        this._send({request: 'get_artmode_status'});
                    }

                } else {
                    reject(new ArtSocketOpenError(null, response));
                }

                this.device.log.debug(response);
            });
        });
    }

    _heartbeat() {
        clearTimeout(this.heartbeat);

        this.heartbeat = setTimeout(() => this.close(), HEARTBEAT_TIMEOUT);
    }

    /**
     * Encode TV name to base64
     * @return {string}
     */
    _encodeName() {
        return new Buffer.from(this.name).toString('base64');
    }

    /**
     * Function to add delay
     * @param  {Number} ms
     * @return {Promise}
     */
    _delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms || this.delay));
    }
}