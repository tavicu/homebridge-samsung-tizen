import { Characteristic } from 'homebridge';
import { Device } from '../device/device.js';

const DEFAULTS: Record<string, string> = {
  REWIND: 'KEY_REWIND',
  FAST_FORWARD: 'KEY_FF',
  ARROW_UP: 'KEY_UP',
  ARROW_DOWN: 'KEY_DOWN',
  ARROW_LEFT: 'KEY_LEFT',
  ARROW_RIGHT: 'KEY_RIGHT',
  SELECT: 'KEY_ENTER',
  BACK: 'KEY_RETURN',
  EXIT: 'KEY_RETURN',
  PLAY_PAUSE: 'KEY_PLAY_BACK',
  INFORMATION: 'KEY_INFO',
};

export function getRemoteKeysMap(device: Device, characteristic: typeof Characteristic): Record<number, string> {
  const output: Record<number, string> = {};
  const userKeys: Record<string, string> = {};
  const RemoteKeyEnum = characteristic.RemoteKey;

  for (const [key, value] of Object.entries(device.config.keys || {})) {
    userKeys[key.toUpperCase()] = value;
  }

  for (const [name, defaultValue] of Object.entries(DEFAULTS)) {
    const numericKey = RemoteKeyEnum?.[name];
    const command = userKeys[name] || defaultValue;

    if (typeof numericKey === 'number' && command) {
      output[numericKey] = command;
    }
  }

  return output;
}
