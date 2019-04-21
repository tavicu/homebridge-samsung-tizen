let Remote          = require('./remote');
let MainAccessory   = require('./accessories/main');
let SwitchAccessory = require('./accessories/switch');

let EventEmitter    = require('events');

module.exports = class Device extends EventEmitter {
    constructor(platform, hap, config) {
        super();

        this.hap           = hap;
        this.platform      = platform;
        this.accessories   = [];
        this.applications  = null;
        this.mainAccessory = null;

        this.config = {
            ...platform.config,
            ...config
        };

        this.uuid = this.hap.uuid.generate(this.config.mac);

        // Check if we have device info
        if (!this.config.ip) throw new Error(`TV IP address is required for ${this.config.name}`);
        if (!this.config.mac) throw new Error(`TV MAC address is required for ${this.config.name}`);

        this.remote = new Remote(this);

        this.initLogger();
        this.initRefresh();
        this.initAccessories();

        platform.api.on('didFinishLaunching', () => setTimeout(() => this.emit('loaded'), 8000));
    }

    initLogger() {
        let logger = Object.assign(Object.create(Object.getPrototypeOf(this.platform.log)), this.platform.log, {
            prefix: this.config.name
        });

        this.log   = function(message) { logger.log(null, message); }
        this.error = function(message) { logger.error(message); }
        this.debug = function(message) { logger.debug('[DEBUG]', message); }
    }

    initRefresh() {
        if (this.config.refresh === false) { return; }

        this.on('paired', () => {
            let intervals = require('./options/refresh')(this.config);

            if (intervals.main) {
                setInterval(() => this.mainAccessory.getValue(), intervals.main);
            }

            if (intervals.switch) {
                let accessories = this.accessories.filter(accessory => accessory.type == 'switch' && !accessory.stateless);

                setInterval(() => accessories.forEach(accessory => accessory.getValue()), intervals.switch);
            }
        });
    }

    initAccessories() {
        this.accessories   = [];
        this.mainAccessory = new MainAccessory(this)

        this.accessories.push(this.mainAccessory);

        if (Array.isArray(this.config['switches'])) {
            for (let element of this.config['switches']) {
                // Append switch with device name
                element.name = `${element.name} ${this.config['name']}`;

                // Create and add the new accessory
                this.accessories.push(new SwitchAccessory({
                    ...this,
                    config: {
                        ...this.config,
                        ...element
                    }
                }));
            }
        }
    }
}