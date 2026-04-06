import { PlatformIdentifier, PlatformName } from 'homebridge';

export type PlatformConfig = {
    platform: PlatformName | PlatformIdentifier;
    devices?: Array<DeviceConfig>;
    api_key?: string;
    inputs?: Array<any>;
    switches?: Array<any>;
};

export type DeviceConfig = {
    name: string;
    ip: string;
    mac: string;
    uuid?: string;
    api_key?: string;
    device_id?: string;
    inputs?: Array<any>;
    switches?: Array<any>;
    options?: Array<string>;
};

export type InputConfig = {
    name: string;
    type: string;
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
