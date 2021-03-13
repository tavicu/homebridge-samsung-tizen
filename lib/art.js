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
        this.url    = `ws://${device.config.ip}:8001/api/v2/channels/com.samsung.art-app?name=${this._encodeName()}`;

        this.device = device;

        this._refresh();

        this.device.on('destroy', () => this.destroy());
    }

    destroy() {
        this.destroyed = true;
        this._close();
    }

    getStatus() {
        return Promise.resolve(this.status);
    }

    setStatus(value) {
        this.status = value;

        // Save that we change status manually
        this.skipStatusUpdate = true;

        return this._send({
            value: value ? 'on' : 'off',
            request: 'set_artmode_status'
        }).finally(() => {
            // Reset changing status manually
            setTimeout(() => this.skipStatusUpdate = false, 3000);
        });
    }

    async _send(data) {
        this.device.log.debug(data);

        // Check socket
        await this._check();

        // Stop heartbeat while sending
        clearTimeout(this.heartbeat);

        await new Promise(resolve => this.socket.send(JSON.stringify({
            method : 'ms.channel.emit',
            params : {
                data  : JSON.stringify(Object.assign({
                    id: this.data.id || 'noop-id'
                },data)),
                to    : 'host',
                event : 'art_app_request'
            }
        }), () => resolve()));
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
                return new Promise(resolve => setTimeout(() => resolve(this._check()), 500));
            }
        }

        try {
            await this._open();
            await this._delay(150);
        } catch(error) {
            throw new ArtSocketOpenError(error.message);
        }
    }

    _open() {
        return new Promise((resolve, reject) => {
            this.socket = new ws(this.url, {
                servername: '',
                handshakeTimeout: 15 * 1000,
                rejectUnauthorized: false
            })
            .on('error', error => reject(new ArtSocketOpenError(error.message)))
            .on('ping', () => this._heartbeat())
            .on('message', response => {
                response = JSON.parse(response);

                this.device.log.debug(response);

                if (response.event === 'ms.channel.connect') {
                    this.data = response.data;

                } else if (response.event === 'ms.channel.ready') {
                    resolve();

                    if (!this.skipStatusUpdate) {
                        this._send({request: 'get_artmode_status'});
                    }

                } else if (response.event === 'd2d_service_message') {
                    let emitValue, data = JSON.parse(response.data);

                    if (data.event === 'artmode_status') {
                        emitValue  = data.value;
                        this.status = data.value === 'on';

                    } else if (data.event === 'art_mode_changed') {
                        emitValue  = data.status;
                        this.status = data.status === 'on';

                    } else if (data.event === 'go_to_standby') {
                        emitValue  = 'standby';
                        this.status = false;

                    } else if (data.event === 'wakeup') {
                        if (!this.skipStatusUpdate) {
                            this._send({request: 'get_artmode_status'});
                        }
                    }

                    if (emitValue) {
                        this.device.emit('artmode.update', emitValue);
                    }

                } else {
                    reject(new ArtSocketOpenError(null, response));
                }
            });
        });
    }

    _close() {
        if (this.socket) {
            this.socket.terminate();
        }
    }

    _refresh() {
        this._check()
            .then(() => 1000)
            .catch(() => 250)
            .then(timeout => setTimeout(() => this._refresh(), timeout || 250));
    }

    _heartbeat() {
        clearTimeout(this.heartbeat);

        this.heartbeat = setTimeout(() => this._close(), HEARTBEAT_TIMEOUT);
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