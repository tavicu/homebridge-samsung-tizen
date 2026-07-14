import { Device } from '../device/device.js';

const DEFAULTS: Record<string, string> = {
  ARROW_UP: 'KEY_UP',
  ARROW_DOWN: 'KEY_DOWN',
  ARROW_LEFT: 'KEY_LEFT',
  ARROW_RIGHT: 'KEY_RIGHT',
  SELECT: 'KEY_ENTER',
  BACK: 'KEY_RETURN',
  PLAY_PAUSE: 'KEY_PLAY_BACK',
  INFORMATION: 'KEY_INFO',
};

export function getRemoteKeysMap(device: Device, characteristic: any): Record<number, string> {
  const output: Record<number, string> = {};
  const userKeys: Record<string, string> = {};
  const RemoteKeyEnum = characteristic.RemoteKey;

  for (const [key, value] of Object.entries(device.config.keys || {})) {
    userKeys[key.toUpperCase()] = value;
  }

  for (const [key, defaultValue] of Object.entries(DEFAULTS)) {
    const numericKey = RemoteKeyEnum?.[key];

    if (typeof numericKey === 'number') {
      output[numericKey] = userKeys[key] || defaultValue;
    }
  }

  return output;
}
