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

type SwitchOptionDefinition = Pick<SwitchOption, 'key' | 'offable' | 'polled'> & {
  build: (ctx: SwitchOptionContext) => Pick<SwitchOption, 'get' | 'set'>;
};

// Before picture modes were identified by their SmartThings mode id (e.g. `modeMovie`), the
// configuration interface saved the English display name instead. Those are the only 4 values
// that could ever have been saved, so old configs are mapped to their id here.
const LEGACY_PICTURE_MODE_IDS: Record<string, string> = {
  Dynamic: 'modeDynamic',
  Standard: 'modeStandard',
  Natural: 'modeNatural',
  Movie: 'modeMovie',
};

function normalizePictureMode(value: string): string {
  return LEGACY_PICTURE_MODE_IDS[value] || value;
}

/**
 * One definition per config key a switch can act on. `key` is only written here; identifier
 * fingerprints in identifiers.ts derive the list of keys from this array.
 *
 * `offable` is about set: Home can turn the option off (mute, sleep). Without it, OFF is ignored
 * (app, input, command) because there is no matching TV action.
 * `polled` is about get: state is not in DeviceState / events, so AccessoryPoller must ask the TV
 * (app visibility, HDMI source, picture mode). Those gets are skipped when the TV is off.
 * mute/sleep have get but are not polled.
 * A switch is stateless when no option has get (command, volume, channel).
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
    build: ({ config, device }) => ({
      get: async () => device.mute === config.mute,
      set: async (switchValue: boolean) => {
        await device.setMute(switchValue === config.mute);
      },
    }),
  },

  {
    key: 'app',
    polled: true,
    build: ({ config, device, service }) => ({
      get: async () => {
        const application = await device.getApplication(config.app as string | number);
        return application?.visible ?? false;
      },
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
    polled: true,
    build: ({ config, device }) => ({
      get: async () => (await device.getInputSource()) === config.input,
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
    polled: true,
    build: ({ config, device }) => {
      const pictureMode = normalizePictureMode(config.picture_mode as string);

      return {
        get: async () => (await device.getPictureMode()) === pictureMode,
        set: async (_switchValue: boolean) => {
          await device.setPictureMode(pictureMode);
        },
      };
    },
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

  const options = OPTION_DEFINITIONS.map(({ key, offable, polled, build }) => ({
    key,
    offable,
    polled,
    ...build({ config, device, service }),
  }));

  return options.filter((option) => option.key === 'power' || config[option.key] !== undefined);
}
