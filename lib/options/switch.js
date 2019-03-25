module.exports = function(accessory) {
    let device = accessory.device;

    let options = [
        {
            key: 'power',
            stateless: true,
            value: accessory.config['power'],

            set: async function(switchValue, option) {
                let isActive = await device.remote.getActive();

                if (!option.value && !isActive) {
                    throw new Error('TV is OFF boss');
                }

                if (isActive) {
                    return Promise.resolve();
                }

                await device.remote.setActive(true);

                device.mainAccessory.updateValue(true);

                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        },

        {
            key: 'sleep',
            stateless: false,
            value: accessory.config['sleep'],

            get: async function(option) {
                return device.remote.getSleep();
            },

            set: async function(switchValue, option) {
                await device.remote.setSleep(switchValue ? option.value : 0, () => {
                    accessory.updateValue(false);
                    device.mainAccessory.updateValue(false);
                });
            }
        },

        {
            key: 'mute',
            stateless: true,
            value: accessory.config['mute'],

            set: async function(switchValue, option) {
                await device.remote.mute();
            }
        },

        {
            key: 'channel',
            stateless: true,
            value: accessory.config['channel'],

            set: async function(switchValue, option) {
                await device.remote.setChannel(option.value);
            }
        },

        {
            key: 'app',
            stateless: false,
            value: accessory.config['app'],

            get: async function(option) {
                let application = await device.remote.getApplication(option.value);

                return application.visible;
            },

            set: async function(switchValue, option) {
                if (!switchValue) {
                    return setTimeout(() => accessory.getValue(), 100);
                }

                await device.remote.openApplication(option.value);
            }
        },

        {
            key: 'command',
            stateless: true,
            value: accessory.config['command'],

            set: async function(switchValue, option) {
                await device.remote.command(option.value);
            }
        }
    ];

    return options.filter(option => option.key == 'power' || accessory.config[option.key] != undefined);
}