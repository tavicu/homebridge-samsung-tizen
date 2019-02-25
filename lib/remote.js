let wol       = require('wake_on_lan');

let MethodWS  = require('./methods/ws');
let MethodWSS = require('./methods/wss');

const TURNING_TIMEOUT  = 1000 * 5;
const SLEEPING_TIMEOUT = 1000 * 15;

module.exports = class Remote {
    constructor(device) {
        this.device       = device;
        this.pairRetries  = 3;

        this.turningOn    = null;
        this.turningOff   = null;
        this.sleepingMode = null;
        this.sleepTimeout = null;

        this.lastActive   = null;

        this._initApi();

        this.device.on('loaded', () => {
            this._pair();
        });

        this.device.on('paired', () => {
            this._installedApplications();
        });
    }

    async getActive() {
        if (this.turningOn    !== null) { return true; }
        if (this.turningOff   !== null) { return false; }
        if (this.sleepingMode !== null) { return false; }

        if (this.lastActive && Date.now() <= this.lastActive.date + 3000) {
            return this.lastActive.value;
        }

        let active = await this.api.isActive();

        this.lastActive = {
            value: active,
            date: Date.now()
        };

        return active;
    }

    async getActiveReal() {
        return await this.api.isActive();
    }

    async setActive(value) {
        if (value) {
            await this._turnOn();
        } else {
            await this._turnOff();
        }
    }

    async getSleep() {
        return await this.getActive() && this.sleepTimeout !== null;
    }

    async setSleep(minutes, callback) {
        if (!minutes) {
            clearTimeout(this.sleepTimeout);
            this.sleepTimeout = null;

            return Promise.resolve();
        }

        if (!await this.getActive()) {
            throw new Error();
        }

        this.sleepTimeout = setTimeout(async () => {
            this.sleepTimeout = null;

            await this._turnOff()

            callback.call(null);
        }, 1000 * 60 * parseInt(minutes));
    }

    getApplication(appId) {
        return this.api.getApplication(appId);
    }

    async openApplication(appId) {
        await this.api.openApplication(appId);
    }

    async setChannel(channel) {
        if (isNaN(parseInt(channel))) {
            throw new Error('Invalid channel number');
        }

        let commands = String(channel).split('').map(value => `KEY_${value}`);
        commands.push('KEY_ENTER');

        await this.command(commands);
    }

    async command(commands) {
        if (!Array.isArray(commands)) { commands = [commands]; }

        commands = commands.map(cmd => {
            let split = cmd.split('*');

            if (split[1]) {
                if (/^.*\*\d+s$/.test(cmd)) {
                    return {key: split[0], time: parseInt(split[1])};
                }

                return Array(parseInt(split[1])).fill(split[0]);
            }

            return cmd;
        }).reduce((acc, val) => acc.concat(val), []);

        for (let index in commands) {
            if (!commands[index]) { continue; }

            if (typeof commands[index] === 'object') {
                await this.api.holdKey(commands[index].key, commands[index].time * 1000);
            } else {
                await this.api.clickKey(commands[index]);
            }

            if (index < commands.length - 1) {
                await this.api._delay();
            }
        }
    }

    async mute() {
        await this.api.clickKey('KEY_MUTE');
    }

    _initApi() {
        if (this.device.config.method == 'ws') {
            this.api = new MethodWS(this.device);
        } else {
            this.api = new MethodWSS(this.device);
        }
    }

    _pair() {
        this.api.pair().then(() => {
            this.device.emit('paired');
        }).catch(error => {
            if (this.pairRetries > 1) {
                this._pair();

                this.pairRetries--;
            }
        });
    }

    _installedApplications() {
        if (process.argv.indexOf('tizen-apps') == -1) { return; }

        this.api.getApplications().then(applications => {
            console.log(this.device.config.name);
            console.table(applications, ['name', 'appId']);
        }).catch(error => {
            console.log('err', error);
        });
    }

    async _turnOn() {
        if (this.turningOff !== null) {
            throw new Error('Powering OFF is in progress');
        }

        let active = await this.getActiveReal();

        if (active && this.sleepingMode === null) {
            return new Error('TV is already ON');
        }

        clearTimeout(this.sleepingMode);
        this.sleepingMode = null;

        if (active) {
            await this.api.clickKey('KEY_POWER');

            this.turningOn = setTimeout(() => this.turningOn = null, TURNING_TIMEOUT);

            return true;
        }

        await new Promise((resolve, reject) => wol.wake(this.device.config.mac, {
            address: this.device.config.ip
        }, error => {
            console.log(error);
            if (error) {
                reject(new Error('asgaga2'));
            } else {
                this.turningOn = setTimeout(() => this.turningOn = null, TURNING_TIMEOUT);

                resolve();
            }
        }));
    }

    async _turnOff() {
        if (this.turningOn !== null) {
            throw new Error('Powering ON is in progress');
        }

        if (this.sleepingMode !== null) {
            return new Error('TV is already OFF');
        }

        let active = await this.getActiveReal();

        if (!active) {
            return new Error('TV is already OFF');
        }

        await this.api.clickKey('KEY_POWER');

        this.turningOff   = setTimeout(() => {
            this.turningOff = null;
            this.api.close();
        }, TURNING_TIMEOUT);

        this.sleepingMode = setTimeout(() => this.sleepingMode = null, SLEEPING_TIMEOUT);
    }
}