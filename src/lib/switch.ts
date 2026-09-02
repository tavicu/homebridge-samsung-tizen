import type { SwitchAccessory } from '../accessories/index.js';
import type { Device } from '../device/device.js';
import { TvOfflineError } from '../errors.js';
import type { SwitchService } from '../services/index.js';
import { SwitchOption } from '../types/types.js';
import { sleep } from './tools.js';

type SwitchOptionContext = {
  config: SwitchAccessory['config'];
  device: Device;
  service: SwitchService;
};

type SwitchOptionDefinition = Pick<SwitchOption, 'key' | 'offable'> & {
  build: (ctx: SwitchOptionContext) => Pick<SwitchOption, 'get' | 'set'>;
};

/**
 * One definition per config key a switch can act on. `key` is only written here; identifier
 * fingerprints in identifiers.ts derive the list of keys from this array.
 */
const OPTION_DEFINITIONS: Array<SwitchOptionDefinition> = [
  {
    key: 'power',
    build: ({ config, device }) => ({
      set: async (_switchValue: boolean) => {
        if (!config.power && !device.power) {
          throw new TvOfflineError();
        }

        if (device.power) {
          return;
        }

        await device.setPower(true);
        await sleep(3000);
      },
    }),
  },

  {
    key: 'sleep',
    offable: true,
    build: ({ config, device, service }) => ({
      get: async () => !!device.sleep,
      set: async (switchValue: boolean) => {
        await device.setSleep(switchValue ? config.sleep || 0 : 0, () => {
          service.updateValue(false);
        });
      },
    }),
  },

  {
    key: 'mute',
    offable: true,
    build: ({ device }) => ({
      get: async () => device.mute,
      set: async (switchValue: boolean) => {
        await device.setMute(switchValue);
      },
    }),
  },

  {
    key: 'app',
    build: ({ config, device, service }) => ({
      set: async (switchValue: boolean) => {
        if (!switchValue) {
          setTimeout(() => service.updateValue(), 100);
          return;
        }

        await device.startApplication(config.app as string | number);
      },
    }),
  },

  {
    key: 'input',
    build: ({ config, device }) => ({
      set: async (_switchValue: boolean) => {
        await device.setInputSource(config.input as string);
      },
    }),
  },

  {
    key: 'channel',
    build: ({ config, device }) => ({
      set: async (_switchValue: boolean) => {
        await device.setChannel(config.channel as number | string);
      },
    }),
  },

  {
    key: 'picture_mode',
    build: ({ config, device }) => ({
      set: async (_switchValue: boolean) => {
        await device.setPictureMode(config.picture_mode as string);
      },
    }),
  },

  {
    key: 'volume',
    build: ({ config, device }) => ({
      set: async (_switchValue: boolean) => {
        await device.setVolume(config.volume as number);
      },
    }),
  },

  {
    key: 'command',
    build: ({ config, device }) => ({
      set: async (_switchValue: boolean) => {
        await device.sendCommand(config.command as string | string[]);
      },
    }),
  },
];

export const SWITCH_OPTION_KEYS = OPTION_DEFINITIONS.map((definition) => definition.key);

export function getSwitchOptions(accessory: SwitchAccessory, device: Device, service: SwitchService): SwitchOption[] {
  const { config } = accessory;

  const options = OPTION_DEFINITIONS.map(({ key, offable, build }) => ({
    key,
    offable,
    ...build({ config, device, service }),
  }));

  return options.filter((option) => option.key === 'power' || config[option.key] !== undefined);
}
