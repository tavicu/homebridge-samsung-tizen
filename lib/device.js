const deepmerge         = require('deepmerge');

let Cache               = require('./cache');
let Remote              = require('./remote');
let FrameAccessory      = require('./accessories/frame');
let SwitchAccessory     = require('./accessories/switch');
let TelevisionAccessory = require('./accessories/television');
let EventEmitter        = require('events');

let Homebridge, Platform, Storage;

module.exports = class Device extends EventEmitter {
    constructor(config, platform, homebridge) {
        super();

        Platform   = platform;
        Storage    = platform.storage;
        Homebridge = homebridge;

        this.config = deepmerge.all([
            {
                uuid      : '',
                wol       : {},
                options   : [],
                api_key   : null,
                device_id : null
            },
            Platform.config,
            config
        ]);

        // Check if we have device info
        if (!this.config.ip) throw new Error(`TV IP address is required for ${this.config.name}`);
        if (!this.config.mac) throw new Error(`TV MAC address is required for ${this.config.name}`);

        this.UUID = Homebridge.hap.uuid.generate(this.config.mac + this.config.uuid);

        this.initLogger();
        this.initStorage();
        this.initEvents();

        this.cache       = new Cache(this);
        this.remote      = new Remote(this);
        this.accessories = [
            new TelevisionAccessory(this, Platform, Homebridge),
            new FrameAccessory(this, Platform, Homebridge)
        ];

        // Switches
        this.config.switches.forEach((element, index) => {
            try {
               let accessory = new SwitchAccessory({
                    ...element,
                    identifier: parseInt(index) + 1
               }, this, Platform, Homebridge);

                this.accessories.push(accessory);
            } catch(error) {
                this.log.error(error.message);
            }
        });

        // Emit init event
        setTimeout(() => this.emit('init'));

        // Emit loaded event
        setTimeout(() => this.emit('loaded'), 8000);

        // When state change emit update event
        ['wakeup', 'standby', 'artmode.change'].forEach(event => this.on(event, () => this.emit('state.change')));

        // Homebridge is going down, emit destroy event
        ['SIGINT', 'SIGTERM'].forEach(signal => process.on(signal, () => this.emit('destroy')));
    }

    initLogger() {
        let logger = Object.assign(Object.create(Object.getPrototypeOf(Platform.log)), Platform.log, {
            prefix: this.config.name
        });

        this.log       = function(...args) { logger.log.apply(logger, [null, ...args]); }
        this.log.info  = function(...args) { logger.info.apply(logger, args); }
        this.log.warn  = function(...args) { logger.warn.apply(logger, args); }
        this.log.error = function(...args) { logger.error.apply(logger, args); }
        this.log.debug = function(...args) { logger.debug.apply(logger, ['[DEBUG]', ...args]); }
    }

    initStorage() {
        this.storage = new Proxy(Storage.get(this.UUID), {
            set: (obj, prop, value) => {
                if (prop == 'update' && typeof value == 'object') {
                    for (const key in value) {
                        obj[key] = value[key];
                    }
                } else {
                    obj[prop] = value;
                }

                Storage.save();
                return true;
            }
        });

        this.log.debug(this.storage);
    }

    initEvents() {
        // Save informations on storage every
        // time we fetch them from TV
        this.on('api.getInfo', (data) => {
            if (!data || !data.device) return;

            this.storage['update'] = {
                frametv: data.device.FrameTVSupport == 'true',
                tokenauth: data.device.TokenAuthSupport == 'true',
                powerstate: data.device.PowerState !== undefined
            };
        });

        // Trigger request to get informations
        // after device was loaded
        this.on('loaded', () => {
            this.remote.getInfo()
                .then(() => this.remote.init())
                .catch(() => {});
        });

        // Add accessories refresh interval
        // after device was paired
        this.on('paired', () => {
            if ([null, false].indexOf(this.config.refresh) !== -1) { return; }

            let intervals = require('./options/refresh')(this.config);

            if (intervals.main) {
                setInterval(() => this.accessories[0].services.main.getValue(), intervals.main);
            }

            if (intervals.switch && this.accessories.length > 1) {
                setInterval(() => this.accessories.slice(1).forEach(element => element.services.main && element.services.main.getValue()), intervals.switch);
            }

            this.log.debug(`Device paired with success (token: ${this.storage.token})`);
        });

        // Refresh all accessories when
        // state of TV was changed
        this.on('state.change', () => {
            this.accessories.forEach(element => element.services.main && element.services.main.getValue())
        });
    }

    hasOption(key) {
        return key && this.config.options && this.config.options.includes(key);
    }
}