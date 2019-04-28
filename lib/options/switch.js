const { TvOfflineError } = require('../errors');

module.exports = function(switchService, accessory) {
    let device = accessory.device;

    let options = [
        {
            key: 'power',
            stateless: true,
            value: switchService.config['power'],

            set: async function(switchValue, option) {
                let isActive = await device.remote.getActive();

                if (!option.value && !isActive) {
                    throw new TvOfflineError();
                }

                if (isActive) {
                    return Promise.resolve();
                }

                await device.remote.setActive(true);
                accessory.services.main.updateValue(true);

                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        },

        {
            key: 'sleep',
            stateless: false,
            value: switchService.config['sleep'],

            get: async function(option) {
                return device.remote.getSleep();
            },

            set: async function(switchValue, option) {
                await device.remote.setSleep(switchValue ? option.value : 0, () => {
                    switchService.updateValue(false);
                    accessory.services.main.updateValue(false);
                });
            }
        },

        {
            key: 'mute',
            stateless: true,
            value: switchService.config['mute'],

            set: async function(switchValue, option) {
                await device.remote.mute();
            }
        },

        {
            key: 'channel',
            stateless: true,
            value: switchService.config['channel'],

            set: async function(switchValue, option) {
                await device.remote.setChannel(option.value);
            }
        },

        {
            key: 'app',
            stateless: false,
            value: switchService.config['app'],

            get: async function(option) {
                let application = await device.remote.getApplication(option.value);

                return application.visible;
            },

            set: async function(switchValue, option) {
                if (!switchValue) {
                    return setTimeout(() => switchService.getValue(), 100);
                }

                await device.remote.openApplication(option.value);
            }
        },

        {
            key: 'command',
            stateless: true,
            value: switchService.config['command'],

            set: async function(switchValue, option) {
                await device.remote.command(option.value);
            }
        }
    ];

    return options.filter(option => option.key == 'power' || switchService.config[option.key] != undefined);
}