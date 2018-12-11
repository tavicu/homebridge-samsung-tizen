let SamsungRemote    = require('./SamsungRemote');
let SamsungAccessory = require('./SamsungAccessory');

module.exports = class SamsungDevice {
    /**
     * Constructor
     *
     * @param  {Object}   platform
     * @param  {Object}   hap
     * @param  {Object}   config
     */
    constructor(platform, hap, config) {
        this.hap         = hap;
        this.config      = config;
        this.api         = platform.api;
        this.refresh     = platform.refresh;
        this.pairRetries = 3;
        this.accessories = [];

        // Change log prefix
        platform.log.prefix = config['name'];

        // Change the log function to use device prefix
        this.log   = function(message) { platform.log.log(null, message) }
        this.debug = function(message) { platform.log.debug('[DEBUG]', message) }

        // Check if we have device info
        if (!config.ip) throw new Error(`TV IP address is required for ${config['name']}`);
        if (!config.mac) throw new Error(`TV MAC address is required for ${config['name']}`);

        // Create the remote for the device
        this.remote = new SamsungRemote(this);

        // Create accessories for device
        this.initAccessories();

        // Listen to event "didFinishLaunching", this means homebridge
        // already finished loading cached accessories.
        this.api.on('didFinishLaunching', () => {
            // Pair device
            this.pairDevice();

            // Init Refresh
            this.initRefresh();

            // Show installed apps
            this.showInstalledApps();
        });
    }

    /**
     * Start pair procedure for device
     */
    async pairDevice(delay = 5000) {
        // Stop if it's already paired
        if (this.config.token) { return; }

        // Check if TV is ON
        if (!await this.remote.isOn(true)) {
            return this.log('Please turn ON the TV for pairing.');
        }

        // Add a delay
        await this._delay(delay);

        // Log
        this.log('Trying to pair the TV');

        // Try pairing
        this.remote.pair(delay).then(token => {
            this.log(`Pair success. SAVE THE TOKEN! Update config file to use {'token': '${token}'}`);

            // Show installed apps
            this.showInstalledApps();
        }, error => {
            // Retry pairing
            if (this.pairRetries > 1) {
                // Try to pair again in 1 second
                this.pairDevice(1000);

                // Decrement retries
                this.pairRetries--;

            } else {
                // Pair failed
                this.log(`Pair failed. Make sure you click Allow on the TV!`);
            }
        });
    }

    /**
     * Start interval to check status
     */
    initRefresh() {
        // Get only power and app accessories
        let accessories = this.accessories.filter(accessory => accessory.type == 'power' || (accessory.type == 'switch' && accessory.switch.app));

        // Check every accessory
        setInterval(() => accessories.forEach(accessory => accessory.characteristic.getValue()), this.refresh ? 500 : 10000);
    }

    /**
     * Show installed apps on TV
     */
    async showInstalledApps() {
        // Check if we have parameter
        if (process.argv.indexOf('tizen-apps') == -1) { return; }

        // Check if we have token
        if (!this.remote.token) { return; }

        // Add a delay
        await this._delay(5000);

        // Get apps
        try {
            await this.remote.getInstalledApps();

            console.table(this.remote.apps, ['name', 'appId']);
        } catch(error) {
            this.debug(error ? error : 'Failed to get installed apps.');
        }
    }

    /**
     * Create the accessories for this device
     *
     * @return {Array}
     */
    initAccessories() {
        this.accessories = [];

        // Create the ON / OFF accessory
        this.accessories.push(new SamsungAccessory(this));

        // If we have custom switches create them
        if (Array.isArray(this.config['switches'])) {
            for (let element of this.config['switches']) {
                // Append switch with device name
                element.name = `${element.name} ${this.config['name']}`;

                // Create and add the new accessory
                this.accessories.push(new SamsungAccessory({...this, config: {...this.config, ...element}}, 'switch'));
            }
        }
    }

    /**
     * Private: Create a delay
     *
     * @param  {Number} ms
     * @return {Promise}
     */
    _delay(ms) {
        return new Promise(resolve => {
            setTimeout(resolve, ms);
        });
    }
}