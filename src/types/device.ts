import { InputConfig, SwitchConfig } from './types.js';
import { WolOptions } from './wol.js';

export type DeviceState = {
  power: boolean;
  mute: boolean;
  volume: number;
};

export type DeviceStorage = {
  token?: string;
  model?: string;
  firmware?: string;
  frameSupport?: boolean;
  tokenSupport?: boolean;
  powerStateSupport?: boolean;
  clear(): void;
};

export type DeviceConfig = {
  name: string;
  ip: string;
  mac: string;
  wol?: WolOptions;
  uuid?: string;
  deviceId?: string;
  inputs?: Array<InputConfig>;
  switches?: Array<SwitchConfig>;
  options?: Array<DeviceOptions>;
  keys?: Record<string, string>;

  /**
   * @deprecated Use `deviceId` instead. Kept for backwards compatibility with older versions.
   */
  device_id?: string;
};

export type DeviceOptions = 'Switch.DeviceName.Disable';
