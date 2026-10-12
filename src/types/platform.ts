import { PlatformIdentifier, PlatformName } from 'homebridge';
import { DeviceConfig } from './device.js';
import { InputConfig } from './input.js';
import { SwitchConfig } from './switch.js';
import { UPnPConfig } from './upnp.js';
import { WolOptions } from './wol.js';

export type PlatformConfig = {
  platform: PlatformName | PlatformIdentifier;
  devices?: Array<DeviceConfig>;
  inputs?: Array<InputConfig>;
  switches?: Array<SwitchConfig>;
  keys?: Record<string, string>;
  wol?: WolOptions;
  upnp?: UPnPConfig;
  clientId?: string;
  clientSecret?: string;
};
