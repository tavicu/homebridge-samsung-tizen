let exec = require('child_process').exec;
let WebSocket = require('ws');
let wol = require('wake_on_lan');
let { base64Encode } = require('../utils');

module.exports = class SamsungRemote {
    /**
     * Constructor
     *
     * @param  {Function} log
     * @param  {Object} config
     */
    constructor(log, config) {
        this.log        = log;
        this.name       = config.name  || 'SamsungTvRemote';
        this.ip         = config.ip    || '192.168.1.0';
        this.mac        = config.mac   || '00:00:00:00';
        this.port       = config.port  || 8001;
        this.delay      = config.delay || 400;

        this.remote     = `http://${this.ip}:${this.port}/api/v2/`;

        // Timers
        this.sleepMode  = null;
        this.turningOn  = null;
        this.turningOff = null;
    }

    /**
     * Check if TV is on
     *
     * @param  {Boolean} getRealStatus
     * @return {Boolean}
     */
    isOn(getRealStatus = false) {
        return new Promise(resolve => {
            if (this.turningOn !== null && !getRealStatus) { resolve(true); }
            if (this.turningOff !== null && !getRealStatus) { resolve(false); }
            if (this.sleepMode !== null && !getRealStatus) { resolve(false); }

            exec('ping -t 1 -c 1 ' + this.ip, (error) => resolve(error ? false : true));
        });
    }

    /**
     * Turn ON the TV
     *
     * @return {Promise}
     */
    turnOn() {
        return new Promise(async (resolve, reject) => {
            let status = await this.isOn(true);

            // Check if TV is turning OFF
            if (this.turningOff !== null) {
                return reject(this.log('Powering OFF is in progress'));
            }

            // Check if TV is already ON
            if (status && this.sleepMode === null) {
                return resolve(this.log('TV is already ON'));
            }

            // Stop sleep mode
            clearTimeout(this.sleepMode);
            this.sleepMode = null;

            // Magic
            if (status) {
                // TV is OFF but still takes commands
                await this.sendCmd('KEY_POWER');

                this.turningOn = setTimeout(() => { this.turningOn = null; }, 1000 * 3);

                return resolve(this.log('TV successfully powered ON'));
            } else {
                // TV is OFF and we need to use WOL
                wol.wake(this.mac, (error) => {
                    if (error) {
                        return reject(this.log('Failed to power on TV'));
                    } else {
                        this.turningOn = setTimeout(() => { this.turningOn = null; }, 1000 * 3);

                        return resolve(this.log('TV successfully powered ON'));
                    }
                });
            }
        });
    }

    /**
     * Turn OFF the TV
     *
     * @return {Promise}
     */
    turnOff() {
        return new Promise(async (resolve, reject) => {
            // Check if TV is turning ON
            if (this.turningOn !== null) {
                return reject(this.log('Powering ON is in progress'));
            }

            // Check if TV is turning OFF
            if (this.sleepMode !== null) {
                return resolve(this.log('TV is already OFF'));
            }

            let status = await this.isOn(true);

            if (!status) {
                return resolve(this.log('TV is already OFF'));
            } else {
                try {
                    await this.sendCmd('KEY_POWER');

                    this.turningOff = setTimeout(() => { this.turningOff = null; }, 1000 * 3);
                    this.sleepMode = setTimeout(() => {
                        this.sleepMode = null;
                        this.socket.close();
                    }, 1000 * 15);

                    resolve(this.log('TV powered OFF'));
                } catch (err) {
                    reject(err);
                }
            }
        });
    }

    /**
     * Send command to TV
     *
     * @param  {String/Array} commands
     * @return {Promise}
     */
    sendCmd(commands) {
        return new Promise(async (resolve, reject) => {
            // Transform to array
            if (!Array.isArray(commands)) { commands = [commands]; }

            // Get connection
            try {
                await this._connection();
            } catch (err) {
                return reject('Can\'t reach TV');
            }

            // Send first command
            this._sendCmd(commands[0]);

            // Send the next commands
            if (commands.length <= 1) {
                resolve();
            } else {
                let count = 1;
                let inter = setInterval(() => {
                    // Send command
                    this._sendCmd(commands[count]);

                    count++;

                    // If it's the last command close the socket
                    if (count > commands.length - 1) {
                        clearInterval(inter);
                        resolve();
                    }
                }, this.delay);
            }
        });
    }

    /**
     * Private: Start WebSocket connection
     *
     * @return {Promise}
     */
    _connection() {
        return new Promise(async (resolve, reject) => {
            // Check if we already have a connection
            if (this.socket) {
                // Reset timeout
                clearTimeout(this.socket.timeout);
                this.socket.timeout = setTimeout(() => this.socket.close(), 1000 * 60 * 2);

                return resolve();
            }

            // Start connection
            this.socket = new WebSocket(this.remote + `channels/samsung.remote.control?name=${base64Encode(this.name)}`);

            // When the socket has an error
            this.socket.on('error', (error) => reject(error));

            // When the socket is closed
            this.socket.on('close', () => {
                clearTimeout(this.socket.timeout);
                this.socket = null;
            });

            // When the socket is open
            this.socket.on('message', (data) => {
                data = JSON.parse(data);

                // Green light
                if (data.event === 'ms.channel.connect') {
                    resolve();

                    // Close the socket in two minutes
                    this.socket.timeout = setTimeout(() => this.socket.close(), 1000 * 60 * 2);
                } else {
                    reject();
                }
            });
        });
    }

    /**
     * Private: Send command to WebSocket
     *
     * @param  {String} command
     */
    _sendCmd(command) {
        this.socket.send(JSON.stringify({
            method: 'ms.remote.control',
            params: {
                Cmd: 'Click',
                DataOfCmd: command,
                Option: false,
                TypeOfRemote: 'SendRemoteKey'
            }
        }));
    }
}