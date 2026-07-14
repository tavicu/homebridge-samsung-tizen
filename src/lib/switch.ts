import { SwitchAccessory } from '../accessories/index.js';
import { Device } from '../device/device.js';
import { TvOfflineError } from '../errors.js';
import { SwitchService } from '../services/index.js';
import { SwitchOption } from '../types/types.js';
import { delay } from './tools.js';

export function getSwitchOptions(accessory: SwitchAccessory, device: Device, service: SwitchService): SwitchOption[] {
  const { config } = accessory;

  const options: SwitchOption[] = [
    {
      key: 'power',
      set: async (_switchValue: boolean) => {
        if (!config.power && !device.power) {
          throw new TvOfflineError();
        }

        if (device.power) {
          return;
        }

        await device.setPower(true);
        await delay(3000);
      },
    },

    {
      key: 'sleep',
      offable: true,
      get: async () => {
        return !!device.sleep;
      },
      set: async (switchValue: boolean) => {
        await device.setSleep(switchValue ? config.sleep || 0 : 0, () => {
          service.updateValue(false);
        });
      },
    },

    {
      key: 'mute',
      offable: true,
      get: async () => {
        return device.mute;
      },
      set: async (switchValue: boolean) => {
        await device.setMute(switchValue);
      },
    },

    {
      key: 'app',
      set: async (switchValue: boolean) => {
        if (!switchValue) {
          setTimeout(() => service.updateValue(), 100);
          return;
        }

        await device.startApplication(config.app as string | number);
      },
    },

    {
      key: 'input',
      set: async (_switchValue: boolean) => {
        await device.setInputSource(config.input as string);
      },
    },

    {
      key: 'channel',
      set: async (_switchValue: boolean) => {
        await device.setChannel(config.channel as number | string);
      },
    },

    {
      key: 'picture_mode',
      set: async (_switchValue: boolean) => {
        await device.setPictureMode(config.picture_mode as string);
      },
    },

    {
      key: 'volume',
      set: async (_switchValue: boolean) => {
        await device.setVolume(config.volume as number);
      },
    },

    {
      key: 'command',
      set: async (_switchValue: boolean) => {
        await device.sendCommand(config.command as string | string[]);
      },
    },
  ];

  return options.filter((option) => option.key === 'power' || config[option.key] !== undefined);
}
