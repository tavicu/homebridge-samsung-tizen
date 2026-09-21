import { InputConfig } from './input.js';
import { SsdpEvent } from './ssdp.js';
import { SwitchConfig } from './switch.js';
import { UPnPData } from './upnp.js';
import { WolOptions } from './wol.js';

export type DeviceState = {
  power: boolean;
  mute: boolean;
  volume: number;
  artmode: boolean;
};

export type DevicePairedEvent = {
  token?: string;
};

export const FrameEvent = {
  STANDBY: 'standby',
  WAKEUP: 'wakeup',
} as const;

export type FrameEvent = (typeof FrameEvent)[keyof typeof FrameEvent];

export type DeviceEvents = {
  'ssdp:update': [event: SsdpEvent, maxAgeSeconds?: number];
  'upnp:update': [data: UPnPData];
  'frame:artmode': [value: boolean];
  'frame:power': [event: FrameEvent];
  'state:update': [prop: keyof DeviceState, value: DeviceState[keyof DeviceState]];
  'apps:update': [apps: StoredApplication[]];
  paired: [data: DevicePairedEvent];
};

export type TizenDeviceInfo = {
  version?: string;
  device?: {
    modelName?: string;
    FrameTVSupport?: string;
    TokenAuthSupport?: string;
    PowerState?: string;
  };
};

export type TizenApplication = {
  id?: string;
  name?: string;
  running?: boolean;
  version?: string;
  visible?: boolean;
};

export type StoredApplication = {
  id: string;
  name: string;
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

export type DeviceOptions = 'Device.Disable' | 'Switch.DeviceName.Disable' | 'Frame.RealPowerMode' | 'Frame.ArtSwitch.Disable' | 'Frame.PowerSwitch.Disable';
