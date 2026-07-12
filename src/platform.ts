import { API, APIEvent, IndependentPlatformPlugin, Logging } from 'homebridge';
import { SwitchAccessory, TelevisionAccessory } from './accessories/index.js';
import { Device } from './device/index.js';
import { Storage } from './lib/storage.js';
import { SSDP } from './protocols/index.js';
import { UPnPManager } from './protocols/upnp.js';
import { PLUGIN_NAME } from './settings.js';
import { DeviceConfig, PlatformConfig } from './types/index.js';

export class SamsungPlatform implements IndependentPlatformPlugin {
  private ssdp: SSDP;
  private upnp: UPnPManager;
  public storage: Storage;
  public devices: Array<Device> = [];

  constructor(
    public log: Logging,
    public config: PlatformConfig,
    public api: API,
  ) {
    this.ssdp = new SSDP(this);
    this.upnp = new UPnPManager(this);
    this.storage = new Storage(api, log);

    this.api.on(APIEvent.DID_FINISH_LAUNCHING, () => this.initialize());
    this.api.on(APIEvent.SHUTDOWN, () => this.shutdown());
  }

  public get upnpManager(): UPnPManager {
    return this.upnp;
  }

  private async initialize(): Promise<void> {
    await this.storage.initialize();

    this.config.devices?.forEach((deviceConfig: DeviceConfig) => {
      try {
        let mainAccessory: TelevisionAccessory;
        const device = new Device(deviceConfig, this);

        this.devices.push(device);

        device.accessories.forEach((accessory: TelevisionAccessory | SwitchAccessory) => {
          if (accessory instanceof TelevisionAccessory) {
            mainAccessory = accessory;
          } else if (mainAccessory) {
            mainAccessory.addAccessory(accessory);
          }
        });

        this.api.publishExternalAccessories(PLUGIN_NAME, [mainAccessory!.platformAccessory]);
      } catch (error) {
        this.log.error(error.message);
        this.log.debug(error.stack);
      }
    });

    this.ssdp.start();
    this.upnp.start();
  }

  private shutdown(): void {
    this.ssdp.destroy();
    this.upnp.destroy();

    this.devices.forEach((device) => device.destroy());
  }
}
