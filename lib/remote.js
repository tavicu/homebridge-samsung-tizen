let delay       = require('delay');

let Art         = require('./art');
let SmartThings = require('./smartthings');

let MethodWS    = require('./methods/ws');
let MethodWSS   = require('./methods/wss');
let MethodFrame = require('./methods/frame');

const {
    TvOfflineError,
    TvAlreadyOnlineError,
    TvAlreadyOfflineError,

    PoweringOnlineError,
    PoweringOfflineError,

    InvalidAppIdError,
    InvalidChannelError,

    GetApplicationsFailedError
} = require('./errors');

const RACE_TIMEOUT    = 1500;
const TURNING_TIMEOUT = 1000 * 5;
const STANDBY_TIMEOUT = 1000 * 17;

module.exports = class Remote {
    constructor(device) {
        this.device       = device;
        this.cache        = device.cache;
        this.pairRetries  = 3;

        this.turningOn    = null;
        this.turningOff   = null;
        this.turningArt   = null;
        this.standbyMode  = null;
        this.sleepTimeout = null;

        this.init();

        this.device.on('loaded', () => {
            this._pair();
        });

        this.device.on('paired', () => {
            this._installedApplications();
        });

        this.device.on('wakeup', () => {
            clearTimeout(this.standbyMode);
            this.standbyMode = null;
        });

        this.device.on('standby', () => {
            this.standbyMode = setTimeout(() => this.standbyMode = null, this.device.storage.powerstate !== true ? STANDBY_TIMEOUT : TURNING_TIMEOUT);
        });
    }

    /**
     * Initialize the remote
     */
    init() {
        if (this.api) {
            this.api.destroy();
        }

        let method = MethodWSS;

        switch(this.device.config.method) {
            case 'ws':
                method = MethodWS;
                break;
            case 'wss':
                method = MethodWSS;
                break;
            case 'frame':
                method = MethodFrame;
                break;
            default:
                if (this.device.storage.tokenauth === false) {
                    method = MethodWS;
                } else if (this.device.storage.frametv === true) {
                    method = MethodFrame;
                }
        }

        // Initialize Art if API is Frame
        if (!this.art && method === MethodFrame) {
            this.art = new Art(this.device);
        }

        // Initialize SmartThings API
        if (!this.smartthings) {
            this.smartthings = new SmartThings(this.device);
        }

        // Initialize API
        this.api = new method(this.device);

        // Emit init event
        setTimeout(() => this.device.emit('remote.init'));
    }

    getMain() {
        if (this.art && !this.device.hasOption('Frame.RealPowerMode')) {
            return this.getArtPower();
        }

        return this.getPower();
    }

    async setMain(value) {
        if (this.art && !this.device.hasOption('Frame.RealPowerMode')) {
            return this.setArtMode(!value);
        }

        return this.setPower(value);
    }

    async getPower() {
        if (this.turningOn   !== null) { return true; }
        if (this.turningOff  !== null) { return false; }
        if (this.standbyMode !== null) { return false; }

        return await this.api.getState();
    }

    async setPower(value) {
        return await this._race(value ? this._turnOn() : this._turnOff());
    }

    async getArtPower() {
        if (this.turningArt  !== null) { return true; }
        if (this.turningOff  !== null) { return false; }
        if (this.standbyMode !== null) { return false; }

        return await this.api.getState().then(status => {
            // If Frame TV get the Art Mode status
            // and return the negated value
            if (status && this.art) {
                return this.art.getStatus().then(status => !status);
            }

            return status;
        });
    }

    async getArtMode() {
        if (!await this.getPower()) {
            return false;
        }

        return this.art && this.art.getStatus();
    }

    async setArtMode(value) {
        let _do = () => this.art.setStatus(value);

        clearTimeout(this.turningArt);
        this.turningArt = null;

        if (!await this.getPower()) {
            this.turningArt = setTimeout(() => this.turningArt = null, TURNING_TIMEOUT);

            await this.setPower(true);

            return this.art && _do() && Promise.resolve();
        }

        return this.art && _do();
    }

    setInputSource(value) {
        return this.smartthings.setInputSource(value);
    }

    /**
     * Get sleep if it's active
     * @return {boolean}
     */
    async getSleep() {
        return await this.getPower() && this.sleepTimeout !== null;
    }

    /**
     * Set sleep command for TV
     * @param {number}   minutes
     * @param {Function} callback
     */
    async setSleep(minutes, callback) {
        if (!minutes) {
            clearTimeout(this.sleepTimeout);
            this.sleepTimeout = null;

            return Promise.resolve();
        }

        if (!await this.getPower()) {
            throw new TvOfflineError();
        }

        this.sleepTimeout = setTimeout(async () => {
            this.sleepTimeout = null;

            await this._turnOff()

            callback.call(null);
        }, 1000 * 60 * parseInt(minutes));
    }

    /**
     * Get TV informations
     * @return {object}
     */
    async getInfo() {
        if (!await this.api.getStatePing()) {
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

    /**
     * Open application
     * @param  {number} appId
     * @return {Promise}
     */
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

    /**
     * Switch the TV to a channel
     * This works only if TV is in Live TV mode
     * @param {number} channel
     */
    async setChannel(channel) {
        if (isNaN(parseInt(channel))) {
            throw new InvalidChannelError(null, channel);
        }

        let commands = String(channel).split('').map(value => `KEY_${value}`);
        commands.push('KEY_ENTER');

        await this.command(commands);
    }

    /**
     * Send commands to TV
     * @param  {string/array} commands
     */
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
                await this.api.hold(commands[index].key, commands[index].time * 1000);
            } else {
                await this.api.click(commands[index]);
            }

            if (index < commands.length - 1) {
                await delay(this.device.config.delay || 400);
            }
        }
    }

    /**
     * Pair the TV.
     * If case of failure it will retry 3 times.
     * @return {Promise}
     */
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

    /**
     * Turn On the TV
     * @return {Promise}
     */
    async _turnOn(options) {
        if (this.turningOff !== null) {
            throw new PoweringOfflineError();
        }

        let active = await this.api.getState();

        if ((active && this.standbyMode === null) || this.turningOn !== null) {
            return new TvAlreadyOnlineError();
        }

        this.cache.flush();

        return this.api.setStateOn().then(() => {
            this.turningOn = setTimeout(() => this.turningOn = null, TURNING_TIMEOUT);

            this.device.emit('wakeup');
        });
    }

    /**
     * To turn Off the TV
     * @return {Promise}
     */
    async _turnOff(options) {
        if (this.turningOn !== null) {
            throw new PoweringOnlineError();
        }

        if (this.turningOff !== null || this.standbyMode !== null) {
            return new TvAlreadyOfflineError();
        }

        let active = await this.api.getState();

        if (!active) {
            return new TvAlreadyOfflineError();
        }

        this.cache.flush();

        return this.api.setStateOff().then(() => {
            this.turningOff = setTimeout(() => this.turningOff = null, TURNING_TIMEOUT);

            this.device.emit('standby');
        });
    }

    /**
     * Fetch installed applications
     */
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

    /**
     * Promise with a timeout
     * @param {Promise} promise
     * @param {number} timeout
     * @return {Promise}
     */
    _race(promise, timeout = RACE_TIMEOUT) {
        const race = new Promise((resolve) => setTimeout(resolve, timeout, true));

        return Promise.race([promise, race]);
    }
}