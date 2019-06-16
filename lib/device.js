let Remote       = require('./remote');
let Accessory    = require('./accessory');

let EventEmitter = require('events');

module.exports = class Device extends EventEmitter {
    constructor(platform, config, homebridge) {
        super();

        this.config = {
            ...platform.config,
            ...config
        };

        // Check if we have device info
        if (!this.config.ip) throw new Error(`TV IP address is required for ${this.config.name}`);
        if (!this.config.mac) throw new Error(`TV MAC address is required for ${this.config.name}`);

        this.platform     = platform;
        this.uuid         = homebridge.hap.uuid.generate(this.config.mac + this.config.uuid);
        this.applications = null;

        this.initLogger();
        this.initStorage();
        this.initRefresh();
        this.initInfo();

        this.remote    = new Remote(this);
        this.accessory = new Accessory(this, homebridge);

        setTimeout(() => this.emit('loaded'), 8000);
    }

    initLogger() {
        let logger = Object.assign(Object.create(Object.getPrototypeOf(this.platform.log)), this.platform.log, {
            prefix: this.config.name
        });

        this.log   = function(message) { logger.log(null, message); }
        this.error = function(message) { logger.error(message); }
        this.debug = function(message) { logger.debug('[DEBUG]', message); }
    }

    initStorage() {
        this.storage = new Proxy(this.platform.storage.get(this.uuid), {
            set: (obj, prop, value) => {
                obj[prop] = value;

                this.platform.storage.save();

                return true;
            }
        });
    }

    initRefresh() {
        if (this.config.refresh === false) { return; }

        this.on('paired', () => {
            let intervals = require('./options/refresh')(this.config);

            if (intervals.main) {
                setInterval(() => this.accessory.services.main.getValue(), intervals.main);
            }

            if (intervals.switch) {
                setInterval(() => this.accessory.switches.forEach(element => element.getValue()), intervals.switch);
            }
        });
    }

    initInfo() {
        this.on('loaded', () => {
            this.remote.getInfo().then(info => {
                for (let key in info) {
                    this.storage[key] = info[key];
                }
            }).catch(() => {});
        });
    }
}