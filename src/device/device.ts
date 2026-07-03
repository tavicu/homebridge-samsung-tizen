import { Logger } from 'homebridge';
import { EventEmitter } from 'events';
import { deepmerge } from 'deepmerge-ts';

import { Cache } from '../lib/cache.js';
import { Remote } from './remote.js';
import { DeviceConfig } from '../types/types.js';
import { SamsungPlatform } from '../platform.js';
import { TelevisionAccessory, SwitchAccessory } from '../accessories/index.js';

export class Device extends EventEmitter {
  public log: Logger;
  public cache: Cache;
  public storage: object;
  public remote: Remote;

  public UUID: string;
  public config: DeviceConfig;
  public accessories: Array<TelevisionAccessory | SwitchAccessory>;

  public state = {
    Power: false,
  };

  constructor(config: DeviceConfig, platform: SamsungPlatform) {
    super();

    this.config = deepmerge(
      {
        api_key: platform.config.api_key,
        inputs: platform.config.inputs,
        switches: platform.config.switches,
      },
      config,
    );

    // Check if we have device minimum config
    if (!this.config.name) {
      throw new Error('One of your device has no name configured. This device will be skipped.');
    }

    if (!this.config.ip) {
      throw new Error(`The IP address is missing from the config for ${this.config.name}. This device will be skipped.`);
    }

    if (!this.config.mac) {
      throw new Error(`The MAC address is missing from the config for ${this.config.name}. This device will be skipped.`);
    }

    // Create UUID for device
    this.UUID = platform.api.hap.uuid.generate(this.config.mac + this.config.uuid || '');

    // Setup logger with device name
    this.log = { ...platform.log, prefix: this.config.name };

    // Homebridge 1.8.0 introduced a `log.success` method that can be used to log success messages
    // For users that are on a version prior to 1.8.0, we need a 'polyfill' for this method
    if (!this.log.success) {
      this.log.success = platform.log.info;
    }

    // Setup storage for this device
    this.storage = new Proxy(platform.storage.get(this.UUID), {
      set: (obj, prop, value) => {
        if (prop === 'update' && typeof value === 'object') {
          for (const key in value) {
            obj[key] = value[key];
          }
        } else {
          obj[prop] = value;
        }

        platform.storage.save();
        return true;
      },
    });

    this.cache = new Cache(this);
    this.remote = new Remote(this);
    this.accessories = [
      new TelevisionAccessory(this, platform),
      // new FrameAccessory(this, platform),
    ];

    // Switches
    // this.config.switches?.forEach((switchConfig, index) => {
    //     try {
    //         this.accessories.push(
    //             new SwitchAccessory(
    //                 {
    //                     ...switchConfig,
    //                     identifier: index + 1,
    //                 },
    //                 this,
    //                 platform,
    //             ),
    //         );
    //     } catch (error) {
    //         this.log.error(error.message);
    //     }
    // });

    // Homebridge is going down, emit destroy event
    // ['SIGINT', 'SIGTERM'].forEach((signal) => process.on(signal, () => this.emit('destroy')));

    this.on('ssdp:update', (event) => {
      console.log('ssdp:update', this.config.ip, event);

      if (event === 'ssdp:alive') {
        this.state.Power = true;
      } else if (event === 'ssdp:byebye') {
        this.state.Power = false;
      }

      this.emit('state:update');
    });

    this.on('state:update', () => {
      const d = new Date();
      const t = d.getHours() + ':' + d.getMinutes() + ':' + d.getSeconds() + '-' + d.getMilliseconds();

      console.log('state:update', t, this.config.ip, this.state);

      this.accessories.forEach((element) => element.services.main && element.services.main.updateValue());
    });
  }

  hasOption(key: string): boolean {
    return Boolean(key && this.config.options?.includes(key));
  }
}
