import * as ssdp from 'peer-ssdp';
import { debounce } from '../lib/tools.js';
import { SamsungPlatform } from '../platform.js';

type Headers = {
  ST: string;
  NT: string;
  NTS: string;
  LOCATION: string;
};

type Address = {
  address: string;
};

export class SSDP {
  private devices = new Map<string, (event: string) => void>();

  private readonly peer: any;
  private readonly possibleEvents: Array<string> = [ssdp.ALIVE, ssdp.BYEBYE];

  constructor(private readonly platform: SamsungPlatform) {
    this.peer = ssdp.createPeer();

    this.peer.on('ready', () => {
      this.search();

      // Sometimes search is not working, so we need to call it again
      setTimeout(() => this.search(), 1000 * 5);
    });
    this.peer.on('notify', this.onNotify.bind(this));
    this.peer.on('found', this.onFound.bind(this));
  }

  public start() {
    this.platform.devices.forEach((device) => {
      const { config } = device;

      this.devices.set(
        config.ip,
        debounce((event: string) => {
          if (this.possibleEvents.includes(event)) {
            device.emit(ssdp.UPDATE, event);
          }
        }),
      );
    });

    this.peer.start();
  }

  public search() {
    this.peer.search({
      ST: 'upnp:rootdevice',
    });
  }

  private onNotify(headers: Headers, address: Address) {
    // Filter response to devices
    if (headers.NT !== 'upnp:rootdevice' || !this.devices.has(address.address)) {
      return;
    }

    // Send received event
    this.devices.get(address.address)?.(headers.NTS);
  }

  private onFound(headers: Headers, address: Address) {
    // Filter response to devices
    if (headers.ST !== 'upnp:rootdevice' || !this.devices.has(address.address)) {
      return;
    }

    // Send alive event
    this.devices.get(address.address)?.(ssdp.ALIVE);
  }

  public destroy() {
    try {
      this.peer?.stopInterfaceDisco();
      this.peer?.close();
    } catch {}
  }
}
