import { Device } from '../device/index.js';
import { SsdpListener } from '../lib/ssdp.js';
import { debounce } from '../lib/tools.js';
import { SamsungPlatform } from '../platform.js';
import { SsdpAddress, SsdpEvent, SsdpHeaders } from '../types/index.js';

type TrackedDevice = {
  device: Device;
  emit: (event: SsdpEvent, maxAgeSeconds?: number) => void;
};

const parseMaxAge = (cacheControl?: string): number | undefined => {
  const match = /max-age\s*=\s*(\d+)/i.exec(cacheControl || '');
  return match ? parseInt(match[1], 10) : undefined;
};

export class SsdpManager {
  private devices = new Map<string, TrackedDevice>();

  private readonly listener: SsdpListener;
  private readonly possibleEvents: Array<SsdpEvent> = [SsdpEvent.ALIVE, SsdpEvent.BYEBYE];
  private searchInterval?: NodeJS.Timeout;

  constructor(private readonly platform: SamsungPlatform) {
    this.listener = new SsdpListener();

    this.listener.on('ready', () => {
      this.search();

      // TVs sometimes ignore the first search even when online, so search again a little later.
      setTimeout(() => this.search(), 1000 * 5);
    });
    this.listener.on('notify', this.onNotify.bind(this));
    this.listener.on('found', this.onFound.bind(this));

    // Without a listener an 'error' event from a socket would crash Homebridge.
    this.listener.on('error', (error: Error) => {
      this.platform.log.debug(`[SSDP] Socket error: ${error?.message || error}`);
    });
  }

  public start() {
    this.platform.devices.forEach((device) => {
      this.devices.set(device.config.ip, {
        device,
        emit: debounce((event: SsdpEvent, maxAgeSeconds?: number) => {
          if (this.possibleEvents.includes(event)) {
            device.emit('ssdp:update', event, maxAgeSeconds);
          }
        }),
      });

      device.on('state:update', (prop) => {
        if (prop === 'power') {
          this.syncSearchInterval();
        }
      });
    });

    try {
      this.listener.start();
    } catch (error: any) {
      this.platform.log.error(`[SSDP] Failed to start: ${error.message || error}`);
    }

    this.syncSearchInterval();
  }

  public search() {
    try {
      this.listener.search('upnp:rootdevice');
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

  private onNotify(headers: SsdpHeaders, address: SsdpAddress) {
    const tracked = this.devices.get(address.address);

    if (headers.NT !== 'upnp:rootdevice' || !tracked) {
      return;
    }

    if (headers.NTS === SsdpEvent.ALIVE) {
      tracked.emit(SsdpEvent.ALIVE, parseMaxAge(headers['CACHE-CONTROL']));
    } else if (headers.NTS === SsdpEvent.BYEBYE) {
      // byebye has no CACHE-CONTROL
      tracked.emit(SsdpEvent.BYEBYE);
    }
  }

  private onFound(headers: SsdpHeaders, address: SsdpAddress) {
    const tracked = this.devices.get(address.address);

    if (headers.ST !== 'upnp:rootdevice' || !tracked || tracked.device.power) {
      return;
    }

    tracked.emit(SsdpEvent.ALIVE, parseMaxAge(headers['CACHE-CONTROL']));
  }

  public destroy() {
    clearInterval(this.searchInterval);

    this.listener.close();
  }
}
