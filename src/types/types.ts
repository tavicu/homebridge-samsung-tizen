import { PlatformIdentifier, PlatformName, Service } from 'homebridge';
import { DeviceConfig } from './device.js';
import { UPnPConfig } from './upnp.js';
import { WolOptions } from './wol.js';

export type LinkedService = Service & {
  linked?: boolean;
};

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

export type InputConfig = {
  name: string;
  type: 'app' | 'input' | 'command';
  value: string | string[];
  identifier: number;
};

export type SwitchConfig = {
  name: string;
  identifier: number;
  power?: boolean;
  sleep?: number;
  mute?: boolean;
  volume?: number;
  app?: string;
  input?: string;
  channel?: number;
  picture_mode?: string;
  sound_mode?: string;
  command?: string | string[];
};

export type SwitchOption = {
  key: string;
  offable?: boolean;
  polled?: boolean;
  get?: () => Promise<boolean>;
  set: (switchValue: boolean) => Promise<void>;
};
