import { Logging } from 'homebridge';

/**
 * Brings a v5 config to the v6 shape in memory, before anything reads it. config.json is never
 * written: the log tells the user what to change. Once v5 configs are gone, delete this file
 * together with its call in the platform constructor.
 */

type LegacyConfig = Record<string, any>;

const UPGRADE_GUIDE = 'https://tavicu.github.io/homebridge-samsung-tizen/extra/upgrading.html';

const IGNORED_KEYS = ['refresh', 'delay', 'timeout', 'wait_time', 'method', 'port'];

const migrateInputs = (inputs: unknown, changes: string[]): void => {
  if (!Array.isArray(inputs)) {
    return;
  }

  inputs.forEach((input: LegacyConfig) => {
    if (input?.type === 'art') {
      input.type = 'artmode';
      changes.push(`input "${input.name}": change type from "art" to "artmode"`);
    }

    if (input?.type === 'input' && input.value === 'digitalTv') {
      input.value = 'dtv';
      changes.push(`input "${input.name}": change value from "digitalTv" to "dtv"`);
    }
  });
};

const migrateSwitches = (switches: unknown, changes: string[]): void => {
  if (!Array.isArray(switches)) {
    return;
  }

  switches.forEach((config: LegacyConfig) => {
    if (config?.input === 'digitalTv') {
      config.input = 'dtv';
      changes.push(`switch "${config.name}": change input from "digitalTv" to "dtv"`);
    }
  });
};

/**
 * Returns true when the scope had anything from v5, so the upgrade guide is linked once at the end.
 */
const migrateScope = (scope: LegacyConfig, log: Logging, prefix: string): boolean => {
  const removable = IGNORED_KEYS.filter((key) => key in scope);
  const changes: string[] = [];
  const apiKey = 'api_key' in scope;

  removable.forEach((key) => delete scope[key]);
  delete scope.api_key;

  if ('device_id' in scope) {
    if (!scope.deviceId) {
      scope.deviceId = scope.device_id;
      changes.push('rename "device_id" to "deviceId"');
    } else {
      removable.push('device_id');
    }

    delete scope.device_id;
  }

  migrateInputs(scope.inputs, changes);
  migrateSwitches(scope.switches, changes);

  if (apiKey) {
    log.warn(`${prefix}SmartThings no longer works with "api_key". Remove it from your config and connect SmartThings again from the plugin settings.`);
  }

  if (changes.length) {
    log.warn(`${prefix}Your config uses v5 values. They work for now, but will stop working in a future version. Please update your config: ${changes.join('; ')}.`);
  }

  if (removable.length) {
    log.warn(`${prefix}These v5 settings are no longer used and can be removed from your config: ${removable.join(', ')}.`);
  }

  return apiKey || changes.length > 0 || removable.length > 0;
};

export function migrateConfig(config: LegacyConfig, log: Logging): void {
  const devices: Array<LegacyConfig> = Array.isArray(config.devices) ? config.devices : [];
  const results = [migrateScope(config, log, ''), ...devices.map((device) => migrateScope(device, log, `[${device.name}] `))];

  if (results.includes(true)) {
    log.warn(`How to upgrade your config from v5: ${UPGRADE_GUIDE}`);
  }
}
