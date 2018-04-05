let exec = require('child_process').exec;
let WebSocket = require('ws');
var wol = require('wake_on_lan');
let { base64Encode } = require('../utils');

module.exports = class SamsungRemote {
    constructor(log, config) {
        this.log    = log;
        this.name   = config.name  || 'SamsungTvRemote';
        this.ip     = config.ip    || '192.168.1.0';
        this.mac    = config.mac   || '00:00:00:00';
        this.port   = config.port  || 8001;
        this.delay  = config.delay || 500;

        this.remote = `http://${this.ip}:${this.port}/api/v2/`;

        this.timerOff = null;
    }

    isOn() {
        return new Promise(resolve => {
            // If TV is shutting down
            if (this.timerOff !== null) {
                resolve(false);
            }

            exec('ping -t 1 -c 1 ' + this.ip, (error) => resolve(error ? false : true));
        });
    }

    turnOn() {
        return new Promise(async (resolve, reject) => {
            if (this.timerOff !== null) {
                await this.sendCmd('KEY_POWER');
                clearTimeout(this.timerOff);
                this.timerOff = null;
                return resolve(this.log('TV powered ON'));
            }

            let status = await this.isOn();

            if (status) {
                return resolve(this.log('TV is already ON'));
            } else {
                wol.wake(this.mac, (err) => {
                    if (err) {
                        this.log('Failed to power on TV');
                        reject();
                    } else {
                        this.log('TV successfully powered ON');
                        resolve();
                    }
                });
            }
        });
    }

    turnOff() {
        return new Promise(async (resolve, reject) => {
            if(this.timerOff !== null) {
                return resolve(this.log('Powering OFF is already in progress'));
            }

            let status = await this.isOn();

            if (!status) {
               return resolve(this.log('TV is already OFF'));
            } else {
                try {
                    await this.sendCmd('KEY_POWER');

                    this.timerOff = setTimeout(() => { this.timerOff = null; }, 3000);

                    resolve(this.log('TV powered OFF'));
                } catch (err) {
                    reject(err);
                }
            }
        });
    }


    sendCmd(commands) {
        return new Promise(async (resolve, reject) => {
            // Start connection
            try {
                this.socket = new WebSocket(this.remote + `channels/samsung.remote.control?name=${base64Encode(this.name)}`);
            } catch (err) {
                reject('Can\'t reach TV');
            }

            // Transform to array
            if (!Array.isArray(commands)) { commands = [commands]; }

            // When socket is up
            this.socket.on('message', (data) => {
                data = JSON.parse(data);

                // Check if we can send commands
                if (data.event === 'ms.channel.connect') {

                    // Send first command
                    this._sendCmd(commands[0]);

                    // Parse rest of the commands
                    let count = 1;
                    let inter = setInterval(() => {
                        // Send command
                        this._sendCmd(commands[count]);

                        count++;

                        // If it's the last command close the socket
                        if (count > commands.length - 1) {
                            clearInterval(inter);
                            this.socket.close();
                            resolve();
                        }
                    }, this.delay);

                } else {
                    this.socket.close();
                    reject();
                }
            });
        });
    }

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