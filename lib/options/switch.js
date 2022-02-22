let utils = require('../utils');

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
            value: Accessory.config['power'],

            set: async function(switchValue, option) {
                let active = await Remote.getPower();

                if (!option.value && !active) {
                    throw new TvOfflineError();
                }

                if (active) {
                    return Promise.resolve();
                }

                await Remote.setPower(true);
                MainAccessory.services.main.updateValue(true);

                await utils.delay(Device.config.wait_time || 3000);
            }
        },

        {
            key: 'sleep',
            offable: true,
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
            value: Accessory.config['mute'],

            set: async function(switchValue, option) {
                await Remote.command('KEY_MUTE');
            }
        },

        {
            key: 'app',
            value: Accessory.config['app'],

            set: async function(switchValue, option) {
                if (!switchValue) {
                    return setTimeout(() => Service.getValue(), 100);
                }

                await Remote.setApplication(option.value);
            }
        },

        {
            key: 'input',
            value: Accessory.config['input'],

            set: async function(switchValue, option) {
                await Remote.setInputSource(option.value);
            }
        },

        {
            key: 'channel',
            value: Accessory.config['channel'],

            set: async function(switchValue, option) {
                await Remote.setChannel(option.value);
            }
        },

        {
            key: 'picture_mode',
            value: Accessory.config['picture_mode'],

            set: async function(switchValue, option) {
                await Remote.setPictureMode(option.value);
            }
        },

        {
            key: 'volume',
            value: Accessory.config['volume'],

            set: async function(switchValue, option) {
                await Remote.setVolume(option.value);
            }
        },

        {
            key: 'command',
            value: Accessory.config['command'],

            set: async function(switchValue, option) {
                await Remote.command(option.value);
            }
        }
    ];

    return options.filter(option => option.key == 'power' || Accessory.config[option.key] != undefined);
}