import { InputConfig, SwitchConfig } from '../types/types.js';
import { SWITCH_OPTION_KEYS } from './switch.js';

/**
 * Name is left out on purpose: renaming an input should keep its HomeKit identity.
 */
const inputFingerprint = (config: InputConfig): string => `${config.type}=${Array.isArray(config.value) ? config.value.join(',') : config.value}`;

/**
 * Name is left out on purpose: renaming a switch should keep its HomeKit identity. Falls back
 * to the name only when a switch has none of the known actions set.
 */
const switchFingerprint = (config: SwitchConfig): string => {
  const actions = SWITCH_OPTION_KEYS.filter((key) => config[key] !== undefined).map((key) => `${key}=${config[key]}`);

  return actions.length ? actions.join('|') : `name=${config.name}`;
};

/**
 * djb2 → unsigned 32-bit. Same string always yields the same number. Never 0: HomeKit uses
 * ActiveIdentifier 0 for "no input selected".
 */
const identifierFrom = (fingerprint: string): number => {
  let hash = 5381;

  for (let i = 0; i < fingerprint.length; i++) {
    hash = (Math.imul(hash, 33) ^ fingerprint.charCodeAt(i)) | 0;
  }

  return hash >>> 0 || 1;
};

/**
 * Same fingerprint always becomes the same HomeKit identifier. Nothing is stored: reorder
 * does not change the number, delete/add does not grow a cache, and config stays unchanged.
 * A second item with the same fingerprint gets `#2` so the two stay distinct.
 */
const withIdentifiers = <T>(configs: Array<T>, fingerprint: (config: T) => string): Array<T & { identifier: number }> => {
  const seen = new Map<string, number>();

  return configs.map((config) => {
    const value = fingerprint(config);
    const count = (seen.get(value) ?? 0) + 1;

    seen.set(value, count);

    return { ...config, identifier: identifierFrom(count > 1 ? `${value}#${count}` : value) };
  });
};

export const withInputIdentifiers = (configs: Array<InputConfig> = []) => withIdentifiers(configs, inputFingerprint);

export const withSwitchIdentifiers = (configs: Array<SwitchConfig> = []) => withIdentifiers(configs, switchFingerprint);
