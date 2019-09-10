let Device, MainAccessory;

const { TvOfflineError } = require('../errors');

module.exports = function(switchService, accessory) {
    Device        = accessory.device;
    MainAccessory = Device.accessories[0];

    let options = [
        {
            key: 'power',
            stateless: true,
            value: switchService.config['power'],

            set: async function(switchValue, option) {
                let isActive = await Device.remote.getActive();

                if (!option.value && !isActive) {
                    throw new TvOfflineError();
                }

                if (isActive) {
                    return Promise.resolve();
                }

                await Device.remote.setActive(true);
                MainAccessory.services.main.updateValue(true);

                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        },

        {
            key: 'sleep',
            stateless: false,
            value: switchService.config['sleep'],

            get: async function(option) {
                return Device.remote.getSleep();
            },

            set: async function(switchValue, option) {
                await Device.remote.setSleep(switchValue ? option.value : 0, () => {
                    switchService.updateValue(false);
                    MainAccessory.services.main.updateValue(false);
                });
            }
        },

        {
            key: 'mute',
            stateless: true,
            value: switchService.config['mute'],

            set: async function(switchValue, option) {
                await Device.remote.mute();
            }
        },

        {
            key: 'channel',
            stateless: true,
            value: switchService.config['channel'],

            set: async function(switchValue, option) {
                await Device.remote.setChannel(option.value);
            }
        },

        {
            key: 'app',
            stateless: false,
            value: switchService.config['app'],

            get: async function(option) {
                let application = await Device.remote.getApplication(option.value);

                return application.visible;
            },

            set: async function(switchValue, option) {
                if (!switchValue) {
                    return setTimeout(() => switchService.getValue(), 100);
                }

                await Device.remote.openApplication(option.value);
            }
        },

        {
            key: 'command',
            stateless: true,
            value: switchService.config['command'],

            set: async function(switchValue, option) {
                await Device.remote.command(option.value);
            }
        }
    ];

    return options.filter(option => option.key == 'power' || switchService.config[option.key] != undefined);
}