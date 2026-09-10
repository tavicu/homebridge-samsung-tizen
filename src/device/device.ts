import { EventEmitter } from 'events';
import { deepmerge } from 'deepmerge-ts';
import { Logging } from 'homebridge';
import { SwitchAccessory, TelevisionAccessory } from '../accessories/index.js';
import { Cache } from '../lib/cache.js';
import { withSwitchIdentifiers } from '../lib/identifiers.js';
import { createDeviceLogger } from '../lib/logger.js';
import { SamsungPlatform } from '../platform.js';
import { DeviceConfig, DeviceEvents, DeviceOptions, DeviceState, DeviceStorage, TizenApplication } from '../types/index.js';
import { DeviceController } from './controller.js';
import { AccessoryPoller } from './poller.js';

export class Device extends EventEmitter<DeviceEvents> {
  public log: Logging;
  public cache: Cache;
  public storage: DeviceStorage;
  private controller: DeviceController;
  private poller: AccessoryPoller;

  public UUID: string;
  public config: DeviceConfig;
  public accessories: Array<TelevisionAccessory | SwitchAccessory>;

  private state: DeviceState = {
    power: false,
    mute: false,
    volume: 10,
  };

  constructor(config: DeviceConfig, platform: SamsungPlatform) {
    super();

    this.config = deepmerge(
      {
        keys: platform.config.keys,
        inputs: platform.config.inputs,
        switches: platform.config.switches,
        wol: platform.config.wol,
      },
      config,
    );

    this.state = new Proxy(this.state, {
      set: (target, prop, value) => {
        if (Reflect.get(target, prop) === value) {
          return true;
        } // Do nothing if value is identical

        Reflect.set(target, prop, value);
        this.emit('state:update', prop as keyof DeviceState, value);
        return true;
      },
    });

    // Check if we have device minimum config
    if (!this.config.name) {
      throw new Error('One of your device has no name configured, skipping initialization...');
    }
    if (!this.config.ip) {
      throw new Error(`The IP address is missing from the config for ${this.config.name}, skipping initialization...`);
    }
    if (!this.config.mac) {
      throw new Error(`The MAC address is missing from the config for ${this.config.name}, skipping initialization...`);
    }

    this.log = createDeviceLogger(platform.log, this.config.name);

    // Create UUID for device
    this.UUID = platform.api.hap.uuid.generate(this.config.mac + (this.config.uuid || ''));

    // Setup dependencies for this device, order is important
    this.storage = platform.storage.get(this.UUID);
    this.cache = new Cache(this);
    this.controller = new DeviceController(this, platform);
    this.poller = new AccessoryPoller(this);

    if (this.storage.tokenSupport === false) {
      this.log.warn(`The TV ${this.config.name} is not supported by this plugin!`);
    }

    this.accessories = [new TelevisionAccessory(this, platform)];

    // Switches
    withSwitchIdentifiers(this.config.switches).forEach((switchConfig) => {
      try {
        this.accessories.push(new SwitchAccessory(switchConfig, this, platform));
      } catch (error) {
        this.log.error(error.message);
      }
    });

    // Events
    this.on('upnp:update', ({ volume, mute }) => {
      this.state.volume = volume ?? this.state.volume;
      this.state.mute = mute ?? this.state.mute;
    });

    this.on('state:update', (prop) => {
      if (prop === 'power') {
        this.controller.clearSleep();
      }

      this.accessories.forEach((accessory) => {
        Object.values(accessory.services).forEach((wrapper) => void wrapper.updateValue());
      });
    });

    this.on('paired', ({ token }) => {
      this.log.debug(`Device paired with success (token: ${token})`);
      this.poller.sync();
    });
  }

  public get power(): boolean {
    return this.state.power;
  }

  public set power(value: boolean) {
    this.state.power = value;
  }

  public get mute(): boolean {
    return this.state.mute;
  }

  public get volume(): number {
    return this.state.volume;
  }

  public get sleep(): boolean {
    return this.power && this.controller.getSleep();
  }

  public async setPower(value: boolean): Promise<void> {
    if (value) {
      await this.controller.powerOn();
    } else {
      this.cache.flush();
      await this.controller.powerOff();
    }
  }

  public setMute(value: boolean): Promise<void> {
    return this.controller.setMute(value);
  }

  public setVolume(value: number): Promise<void> {
    return this.controller.setVolume(value);
  }

  public getInputSource(): Promise<string | null> {
    return this.controller.getInputSource();
  }

  public setInputSource(value: string): Promise<void> {
    return this.controller.setInputSource(value);
  }

  public getPictureMode(): Promise<string | null> {
    return this.controller.getPictureMode();
  }

  public setPictureMode(value: string): Promise<void> {
    return this.controller.setPictureMode(value);
  }

  public getSoundMode(): Promise<string | null> {
    return this.controller.getSoundMode();
  }

  public setSoundMode(value: string): Promise<void> {
    return this.controller.setSoundMode(value);
  }

  public setSleep(minutes: number, onComplete?: () => Promise<void> | void): Promise<void> {
    return this.controller.setSleep(minutes, onComplete);
  }

  public getChannel(): Promise<string | null> {
    return this.controller.getChannel();
  }

  public setChannel(channel: number | string): Promise<void> {
    return this.controller.setChannel(channel);
  }

  public getApplication(appId: string | number): Promise<TizenApplication> {
    return this.controller.getApplication(appId);
  }

  public startApplication(appId: string | number): Promise<TizenApplication> {
    return this.controller.startApplication(appId);
  }

  public sendCommand(commands: string | string[]): Promise<void> {
    return this.controller.sendCommand(commands);
  }

  public hasOption(key: DeviceOptions): boolean {
    return !!(key && this.config.options?.includes(key));
  }

  public destroy(): void {
    this.poller.destroy();
    this.controller.destroy();
  }

  public static isDisabled(config: DeviceConfig): boolean {
    return Array.isArray(config?.options) && config.options.includes('Device.Disable');
  }
}
