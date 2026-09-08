import { retry, sleep } from '../lib/tools.js';
import { SsdpEvent, TizenDeviceInfo } from '../types/index.js';
import { Device } from './device.js';

export type PowerProbe = {
  ping(): Promise<boolean>;
  getInfo(): Promise<TizenDeviceInfo>;
};

type Source = 'ssdp' | 'ping' | 'command';
type Trigger = 'poll' | 'powering' | 'upnp';

const POLL_INTERVAL = 1000 * 45;
const SSDP_FRESH_LIMIT = 1000 * 90;
const POWERING_TIMEOUT = 1000 * 3;

// A TV that went off keeps answering on port 8001 while in standby, around 17 seconds.
// Without PowerState there is nothing to tell standby apart from on, so we wait it out.
const STANDBY_TIMEOUT = 1000 * 20;

export class PowerMonitor {
  private skipPingUntil = 0;
  private latch: { value: boolean; expiresAt: number; timer: NodeJS.Timeout } | null = null;

  constructor(
    private readonly device: Device,
    private readonly probe: PowerProbe,
  ) {
    setInterval(() => void this.confirmViaPing('poll'), POLL_INTERVAL);

    this.device.on('ssdp:update', (event, maxAgeSeconds) => {
      if (event === SsdpEvent.ALIVE) {
        void this.handleSsdpAlive(maxAgeSeconds);
      } else if (event === SsdpEvent.BYEBYE) {
        this.handleSsdpByebye();
      }
    });

    this.device.on('upnp:update', () => {
      if (this.device.power) {
        return;
      }

      void this.confirmViaPing('upnp');
    });
  }

  public get isPowering(): boolean {
    return this.latch !== null;
  }

  public async withPowerLatch(value: boolean, action: () => Promise<void>): Promise<void> {
    this.latchOptimistic(value);

    try {
      await action();
    } catch (error) {
      this.abortLatch(!value);
      throw error;
    }
  }

  public async settled(): Promise<void> {
    if (this.latch) {
      const waitTime = Math.max(0, this.latch.expiresAt - Date.now());
      await sleep(waitTime);
    }
  }

  private async handleSsdpAlive(maxAgeSeconds?: number): Promise<void> {
    const maxAge = maxAgeSeconds && Number.isFinite(maxAgeSeconds) ? maxAgeSeconds * 1000 : SSDP_FRESH_LIMIT;

    this.skipPingUntil = Date.now() + Math.min(maxAge, SSDP_FRESH_LIMIT);
    this.reconcile(await this.isOn(), 'ssdp');
  }

  private handleSsdpByebye(): void {
    this.skipPingUntil = this.device.storage.powerStateSupport ? 0 : Date.now() + STANDBY_TIMEOUT;
    this.reconcile(false, 'ssdp');
  }

  private async confirmViaPing(trigger: Trigger): Promise<void> {
    if (Date.now() < this.skipPingUntil) {
      return;
    }

    try {
      const reachable = await retry(async () => (await this.probe.ping()) || Promise.reject(), { retries: 1, delay: 1000 }).catch(() => false);

      if (!reachable) {
        this.reconcile(false, 'ping');
        return;
      }

      if (trigger === 'poll' && this.device.power) {
        return;
      }

      this.reconcile(await this.isOn(), 'ping');
    } catch (error: any) {
      this.device.log.debug(`[Power] Fallback check (${trigger}) failed: ${error.message || error}`);
    }
  }

  private async isOn(): Promise<boolean> {
    if (!this.device.storage.powerStateSupport) {
      return true;
    }

    try {
      const { device = {} } = await this.probe.getInfo();
      return device.PowerState === 'on';
    } catch {
      return true;
    }
  }

  private reconcile(candidate: boolean, source: Source): void {
    if (this.latch && candidate !== this.latch.value) {
      // Ignore the report if the TV is still turning on or off
      return;
    }

    this.applyPower(candidate, source);
  }

  private latchOptimistic(value: boolean): void {
    this.clearLatch();

    const timeout = !value && !this.device.storage.powerStateSupport ? STANDBY_TIMEOUT : POWERING_TIMEOUT;

    this.latch = {
      value,
      expiresAt: Date.now() + timeout,
      timer: setTimeout(() => {
        this.latch = null;
        void this.confirmViaPing('powering');
      }, timeout),
    };

    this.applyPower(value, 'command');
  }

  private abortLatch(revertTo: boolean): void {
    this.clearLatch();
    this.applyPower(revertTo, 'command');
  }

  private applyPower(value: boolean, _source: Source): void {
    this.device.power = value;
  }

  private clearLatch(): void {
    if (this.latch) {
      clearTimeout(this.latch.timer);
      this.latch = null;
    }
  }
}
