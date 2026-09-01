import { createPeer } from 'peer-ssdp';
import { Device } from '../device/index.js';
import { debounce } from '../lib/tools.js';
import { SamsungPlatform } from '../platform.js';
import { SsdpEvent } from '../types/index.js';

type Headers = {
  ST: string;
  NT: string;
  NTS: string;
  LOCATION: string;
  'CACHE-CONTROL'?: string;
};

type Address = {
  address: string;
};

type TrackedDevice = {
  device: Device;
  emit: (event: string, maxAgeSeconds?: number) => void;
};

const parseMaxAge = (cacheControl?: string): number | undefined => {
  const match = /max-age\s*=\s*(\d+)/i.exec(cacheControl || '');
  return match ? parseInt(match[1], 10) : undefined;
};

export class SSDP {
  private devices = new Map<string, TrackedDevice>();

  private readonly peer: any;
  private readonly possibleEvents: Array<string> = [SsdpEvent.ALIVE, SsdpEvent.BYEBYE];
  private searchInterval?: NodeJS.Timeout;

  constructor(private readonly platform: SamsungPlatform) {
    this.peer = createPeer();

    this.peer.on('ready', () => {
      this.search();

      setTimeout(() => this.search(), 1000 * 5);
    });
    this.peer.on('notify', this.onNotify.bind(this));
    this.peer.on('found', this.onFound.bind(this));
  }

  public start() {
    this.platform.devices.forEach((device) => {
      this.devices.set(device.config.ip, {
        device,
        emit: debounce((event: string, maxAgeSeconds?: number) => {
          if (this.possibleEvents.includes(event)) {
            device.emit('ssdp:update', event, maxAgeSeconds);
          }
        }),
      });

      device.on('state:update', (prop: string) => {
        if (prop === 'power') {
          this.syncSearchInterval();
        }
      });
    });

    this.peer.start();
    this.syncSearchInterval();
  }

  public search() {
    try {
      this.peer.search({
        ST: 'upnp:rootdevice',
      });
    } catch (err) {
      this.platform.log.debug('[SSDP] Search failed: %s', err);
    }
  }

  private syncSearchInterval() {
    const hasOfflineDevice = [...this.devices.values()].some(({ device }) => !device.power);

    if (hasOfflineDevice && !this.searchInterval) {
      this.searchInterval = setInterval(() => this.search(), 1000 * 30);
    }

    if (!hasOfflineDevice) {
      clearInterval(this.searchInterval);
      this.searchInterval = undefined;
    }
  }

  private onNotify(headers: Headers, address: Address) {
    const tracked = this.devices.get(address.address);

    // Filter response to devices
    if (headers.NT !== 'upnp:rootdevice' || !tracked) {
      return;
    }

    // Send received event
    if (headers.NTS === SsdpEvent.ALIVE) {
      tracked.emit(SsdpEvent.ALIVE, parseMaxAge(headers['CACHE-CONTROL']));
    } else if (headers.NTS === SsdpEvent.BYEBYE) {
      // byebye has no CACHE-CONTROL;
      tracked.emit(SsdpEvent.BYEBYE);
    }
  }

  private onFound(headers: Headers, address: Address) {
    const tracked = this.devices.get(address.address);

    // Filter response to devices already known as on
    if (headers.ST !== 'upnp:rootdevice' || !tracked || tracked.device.power) {
      return;
    }

    // Send alive event
    tracked.emit(SsdpEvent.ALIVE, parseMaxAge(headers['CACHE-CONTROL']));
  }

  public destroy() {
    clearInterval(this.searchInterval);

    try {
      this.peer?.stopInterfaceDisco();
      this.peer?.close();
    } catch {}
  }
}
