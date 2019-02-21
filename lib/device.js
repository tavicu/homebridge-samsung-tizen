let Remote          = require('./remote');
let MainAccessory   = require('./accessories/main');
let SwitchAccessory = require('./accessories/switch');

let EventEmitter    = require('events');

const REFRESH_INTERVAL     = 1000 * 30;
const REFRESH_MIN_INTERVAL = 1000;

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

        this.uuid = this.hap.uuid.generate(this.config.name);

        // Check if we have device info
        if (!this.config.ip) throw new Error(`TV IP address is required for ${this.config.name}`);
        if (!this.config.mac) throw new Error(`TV MAC address is required for ${this.config.name}`);

        this.remote = new Remote(this);

        this.initLoggers();
        this.initRefresh();
        this.initAccessories();

        platform.api.on('didFinishLaunching', () => setTimeout(() => this.emit('loaded'), 8000));
    }

    initLoggers() {
        this.platform.log.prefix = this.config.name;

        this.log   = function(message) { this.platform.log.log(null, message); }
        this.debug = function(message) { this.platform.log.debug('[DEBUG]', message); }
    }

    initRefresh() {
        if (this.config.refresh === false) { return; }

        this.on('paired', () => {
            let refreshInterval = isNaN(this.config.refresh) ? REFRESH_INTERVAL : (this.config.refresh < REFRESH_MIN_INTERVAL ? REFRESH_MIN_INTERVAL : this.config.refresh);

            // Get only stateful accessories
            let accessories = this.accessories.filter(accessory => !accessory.stateless);

            // Check every accessory
            setInterval(() => accessories.forEach(accessory => accessory.getValue()), refreshInterval);
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