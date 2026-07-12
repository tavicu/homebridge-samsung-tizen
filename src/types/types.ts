import { PlatformIdentifier, PlatformName, Service } from 'homebridge';
import { DeviceConfig } from './device.js';

export type LinkedService = Service & {
  linked?: boolean;
};

export type PlatformConfig = {
  platform: PlatformName | PlatformIdentifier;
  devices?: Array<DeviceConfig>;
  api_key?: string;
  inputs?: Array<InputConfig>;
  switches?: Array<SwitchConfig>;
};

export type InputConfig = {
  name: string;
  type: 'app' | 'command';
  value: string;
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
  channel: number;
  picture_mode?: string;
  command?: string;
};

export type SwitchOption = {
  key: string;
  offable?: boolean;
  get?: () => Promise<boolean>;
  set: (switchValue: boolean) => Promise<void>;
};
