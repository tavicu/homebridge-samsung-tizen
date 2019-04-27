const { TvOfflineError } = require('../errors');

module.exports = function(element, accessory) {
    let device = accessory.device;

    let options = [
        {
            key: 'power',
            stateless: true,
            value: element.config['power'],

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
            value: element.config['sleep'],

            get: async function(option) {
                return device.remote.getSleep();
            },

            set: async function(switchValue, option) {
                await device.remote.setSleep(switchValue ? option.value : 0, () => {
                    element.updateValue(false);
                    accessory.services.main.updateValue(false);
                });
            }
        },

        {
            key: 'mute',
            stateless: true,
            value: element.config['mute'],

            set: async function(switchValue, option) {
                await device.remote.mute();
            }
        },

        {
            key: 'channel',
            stateless: true,
            value: element.config['channel'],

            set: async function(switchValue, option) {
                await device.remote.setChannel(option.value);
            }
        },

        {
            key: 'app',
            stateless: false,
            value: element.config['app'],

            get: async function(option) {
                let application = await device.remote.getApplication(option.value);

                return application.visible;
            },

            set: async function(switchValue, option) {
                if (!switchValue) {
                    return setTimeout(() => element.getValue(), 100);
                }

                await device.remote.openApplication(option.value);
            }
        },

        {
            key: 'command',
            stateless: true,
            value: element.config['command'],

            set: async function(switchValue, option) {
                await device.remote.command(option.value);
            }
        }
    ];

    return options.filter(option => option.key == 'power' || element.config[option.key] != undefined);
}