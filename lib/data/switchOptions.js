module.exports = function(service) {

    function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    let options = [
        {
            key: 'power',
            stateless: true,
            value: service.device.config['power'],

            set: async function(switchValue, option) {
                let isActive = await service.device.remote.getActive();

                if (!option.value && !isActive) {
                    throw new Error('TV is OFF boss');
                }

                if (isActive) {
                    return Promise.resolve();
                }

                await service.device.remote.setActive(true);

                service.device.mainAccessory.updateValue(true);

                await delay(1500);
            }
        },

        {
            key: 'sleep',
            stateless: false,
            value: service.device.config['sleep'],

            get: async function(option) {
                return service.device.remote.getSleep();
            },

            set: async function(switchValue, option) {
                await service.device.remote.setSleep(switchValue ? option.value : 0, () => {
                    service.characteristic.updateValue(false);
                    service.device.mainAccessory.updateValue(false);
                });
            }
        },

        {
            key: 'mute',
            stateless: true,
            value: service.device.config['mute'],

            set: async function(switchValue, option) {
                await service.device.remote.mute();
            }
        },

        {
            key: 'channel',
            stateless: true,
            value: service.device.config['channel'],

            set: async function(switchValue, option) {
                await service.device.remote.setChannel(option.value);
            }
        },

        {
            key: 'app',
            stateless: false,
            value: service.device.config['app'],

            get: async function(option) {
                let application = await service.device.remote.getApplication(option.value);

                return application.visible;
            },

            set: async function(switchValue, option) {
                if (!switchValue) {
                    return setTimeout(() => service.characteristic.getValue(), 100);
                }

                await service.device.remote.openApplication(option.value);
            }
        },

        {
            key: 'command',
            stateless: true,
            value: service.device.config['command'],

            set: async function(switchValue, option) {
                await service.device.remote.command(option.value);
            }
        }
    ];

    return options.filter(option => option.key == 'power' || service.device.config[option.key] != undefined);
}