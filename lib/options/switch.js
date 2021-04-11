const { TvOfflineError } = require('../errors');

module.exports = function(service, accessory) {
    let Service       = service;
    let Accessory     = accessory;
    let Device        = accessory.device;
    let Remote        = accessory.device.remote;
    let MainAccessory = accessory.device.accessories[0];

    let options = [
        {
            key: 'power',
            stateless: true,
            value: Accessory.config['power'],

            set: async function(switchValue, option) {
                let active = await Remote.getPower();

                if (!option.value && !active) {
                    throw new TvOfflineError();
                }

                if (active) {
                    return Promise.resolve();
                }

                await Remote.setActive(true);
                MainAccessory.services.main.updateValue(true);

                await new Promise(resolve => setTimeout(resolve, 1500));
            }
        },

        {
            key: 'sleep',
            stateless: false,
            value: Accessory.config['sleep'],

            get: async function(option) {
                return Remote.getSleep();
            },

            set: async function(switchValue, option) {
                await Remote.setSleep(switchValue ? option.value : 0, () => {
                    Service.updateValue(false);
                    MainAccessory.services.main.updateValue(false);
                });
            }
        },

        {
            key: 'mute',
            stateless: true,
            value: Accessory.config['mute'],

            set: async function(switchValue, option) {
                await Remote.command('KEY_MUTE');
            }
        },

        {
            key: 'channel',
            stateless: true,
            value: Accessory.config['channel'],

            set: async function(switchValue, option) {
                await Remote.setChannel(option.value);
            }
        },

        {
            key: 'app',
            stateless: false,
            value: Accessory.config['app'],

            get: async function(option) {
                let application = await Remote.getApplication(option.value);

                return application.visible;
            },

            set: async function(switchValue, option) {
                if (!switchValue) {
                    return setTimeout(() => Service.getValue(), 100);
                }

                await Remote.openApplication(option.value);
            }
        },

        {
            key: 'command',
            stateless: true,
            value: Accessory.config['command'],

            set: async function(switchValue, option) {
                await Remote.command(option.value);
            }
        }
    ];

    return options.filter(option => option.key == 'power' || Accessory.config[option.key] != undefined);
}