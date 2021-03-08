let wol = require('wakeonlan');

let MethodWS  = require('./methods/ws');
let MethodWSS = require('./methods/wss');

const {
    TvOfflineError,
    TvAlreadyOnlineError,
    TvAlreadyOfflineError,

    PoweringOnlineError,
    PoweringOfflineError,

    InvalidAppIdError,
    InvalidChannelError,

    WoLFailedError,
    GetApplicationsFailedError
} = require('./errors');

const TURNING_TIMEOUT  = 1000 * 5;
const SLEEPING_TIMEOUT = 1000 * 17;

module.exports = class Remote {
    constructor(device) {
        this.device       = device;
        this.cache        = device.cache;
        this.pairRetries  = 3;

        this.turningOn    = null;
        this.turningOff   = null;
        this.sleepingMode = null;
        this.sleepTimeout = null;

        this.init();

        this.device.on('loaded', () => {
            this._pair();
        });

        this.device.on('paired', () => {
            this._installedApplications();
        });
    }

    init() {
        let method = MethodWSS;

        switch(this.device.config.method) {
            case 'ws':
                method = MethodWS;
                break;
            case 'wss':
                method = MethodWSS;
                break;
            default:
                if (this.device.storage.tokenauth === false) {
                    method = MethodWS;
                }
        }

        this.api = new method(this.device);
    }

    async getActive() {
        if (this.turningOn    !== null) { return true; }
        if (this.turningOff   !== null) { return false; }
        if (this.sleepingMode !== null) { return false; }

        return await this.api.getActive();
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
            throw new TvOfflineError();
        }

        this.sleepTimeout = setTimeout(async () => {
            this.sleepTimeout = null;

            await this._turnOff()

            callback.call(null);
        }, 1000 * 60 * parseInt(minutes));
    }

    async getInfo() {
        if (!await this.getActive()) {
            throw new TvOfflineError();
        }

        return this.api.getInfo();
    }

    /**
     * Get application info and cache it
     * for 250 milliseconds
     * @param  {Number/String} appId
     * @return {Cache}
     */
    getApplication(appId) {
        return this.cache.get(`app-${appId}`, () => this.api.getApplication(appId)
            .then(data => data || '{}')
            .catch(error => ({}))
        , 250);
    }

    openApplication(appId) {
        return new Promise((resolve, reject) => {
            this.api.startApplication(appId).then(data => {
                if (data && data.code == 404) {
                    reject(new InvalidAppIdError(null, appId));
                }

                resolve();
            })
            .catch(error => resolve());
        });
    }

    async setChannel(channel) {
        if (isNaN(parseInt(channel))) {
            throw new InvalidChannelError(null, channel);
        }

        let commands = String(channel).split('').map(value => `KEY_${value}`);
        commands.push('KEY_ENTER');

        await this.command(commands);
    }

    async command(commands) {
        if (!Array.isArray(commands)) {
            // Remove spaces and split after comma
            commands = commands.replace(/\s/g, '').split(',');
        }

        commands = commands.map(cmd => {
            let split = cmd.split('*');

            if (split[1]) {
                if (/^.*\*[0-9]*[.]?[0-9]+s$/.test(cmd)) {
                    return {key: split[0], time: parseFloat(split[1])};
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
        await this.command('KEY_MUTE');
    }

    _pair() {
        this.api.pair().then(() => {
            this.device.emit('paired');
        }).catch(error => {
            if (this.pairRetries > 1) {
                this._pair();

                this.pairRetries--;
            } else {
                this.device.log.error(error.message);
                this.device.log.debug(error.stack);
            }
        });
    }

    _installedApplications() {
        if (process.argv.indexOf('tizen-apps') == -1 && !this.device.config.app_list) { return; }

        this.api.getApplications().then(applications => {
            if (!applications.length) {
                throw new GetApplicationsFailedError();
            }

            console.log(`\u21AA Device: ${this.device.config.name}`);
            console.log('-----------------------------------');

            applications.forEach(app => {
                console.log('App Name : ', app.name);
                console.log('App ID   : ', app.appId);
                console.log('-----------------------------------');
            });
        }).catch(error => {
            this.device.log.error(error.message);
            this.device.log.debug(error.stack);
        });
    }

    async _turnOn() {
        if (this.turningOff !== null) {
            throw new PoweringOfflineError();
        }

        let active = await this.api.getActive();

        if ((active && this.sleepingMode === null) || this.turningOn !== null) {
            return new TvAlreadyOnlineError();
        }

        clearTimeout(this.sleepingMode);
        this.sleepingMode = null;

        if (await this.api.getActivePing()) {
            await this.command('KEY_POWER');

            this.turningOn = setTimeout(() => this.turningOn = null, TURNING_TIMEOUT);

            return true;
        }

        await new Promise((resolve, reject) => wol(this.device.config.mac, this.device.config.wol).then(() => {
            this.turningOn = setTimeout(() => this.turningOn = null, TURNING_TIMEOUT);
            resolve();
        }).catch(() => {
            reject(new WoLFailedError());
        }));
    }

    async _turnOff() {
        if (this.turningOn !== null) {
            throw new PoweringOnlineError();
        }

        if (this.turningOff !== null || this.sleepingMode !== null) {
            return new TvAlreadyOfflineError();
        }

        let active = await this.api.getActive();

        if (!active) {
            return new TvAlreadyOfflineError();
        }

        await this.command('KEY_POWER');

        this.turningOff = setTimeout(() => {
            this.turningOff = null;
            this.api.close();
        }, TURNING_TIMEOUT);

        this.sleepingMode = setTimeout(() => this.sleepingMode = null, SLEEPING_TIMEOUT);
    }
}