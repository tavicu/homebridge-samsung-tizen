import { retry, sleep } from '../lib/tools.js';
import { SsdpEvent, TizenDeviceInfo } from '../types/index.js';
import { Device } from './device.js';

export type PowerProbe = {
  ping(): Promise<boolean>;
  getInfo(): Promise<TizenDeviceInfo>;
};

type Source = 'ssdp' | 'ping' | 'command';
type Trigger = 'poll' | 'powering';

const POLL_INTERVAL = 1000 * 45;
const SSDP_FRESH_LIMIT = 1000 * 60;
const POWERING_TIMEOUT = 1000 * 3;

export class PowerMonitor {
  private ssdpFreshUntil = 0;
  private latch: { value: boolean; expiresAt: number; timer: NodeJS.Timeout } | null = null;

  constructor(
    private readonly device: Device,
    private readonly probe: PowerProbe,
  ) {
    setInterval(() => void this.confirmViaPing('poll'), POLL_INTERVAL);

    this.device.on('ssdp:update', (event, maxAgeSeconds) => {
      console.log('power:ssdp:update', this.device.config.ip, event, maxAgeSeconds ?? '');

      if (event === SsdpEvent.ALIVE) {
        void this.handleSsdpAlive(maxAgeSeconds);
      } else if (event === SsdpEvent.BYEBYE) {
        this.handleSsdpByebye();
      }
    });
  }

  public get isPowering(): boolean {
    return this.latch !== null;
  }

  public latchOptimistic(value: boolean): void {
    this.clearLatch();

    this.latch = {
      value,
      expiresAt: Date.now() + POWERING_TIMEOUT,
      timer: setTimeout(() => {
        this.latch = null;
        void this.confirmViaPing('powering');
      }, POWERING_TIMEOUT),
    };

    this.applyPower(value, 'command');
  }

  public async settled(): Promise<void> {
    if (this.latch) {
      const waitTime = Math.max(0, this.latch.expiresAt - Date.now());
      await sleep(waitTime);
    }
  }

  private async handleSsdpAlive(maxAgeSeconds?: number): Promise<void> {
    const maxAge = maxAgeSeconds && Number.isFinite(maxAgeSeconds) ? maxAgeSeconds * 1000 : SSDP_FRESH_LIMIT;

    this.ssdpFreshUntil = Date.now() + Math.min(maxAge, SSDP_FRESH_LIMIT);
    this.reconcile(await this.isOn(), 'ssdp');
  }

  private handleSsdpByebye(): void {
    this.ssdpFreshUntil = 0;
    this.reconcile(false, 'ssdp');
  }

  private async confirmViaPing(trigger: Trigger): Promise<void> {
    if (Date.now() < this.ssdpFreshUntil) {
      return;
    }

    try {
      const reachable = await retry(async () => (await this.probe.ping()) || Promise.reject(), { retries: 1, delay: 1000 }).catch(() => false);

      if (!reachable) {
        console.log('power:confirmViaPing:reachable', reachable);
        this.reconcile(false, 'ping');
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
      console.log('power:isOn:powerState', device.PowerState);
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

  private applyPower(value: boolean, source: Source): void {
    console.log('power:applyPower', value, source);

    this.device.power = value;
  }

  private clearLatch(): void {
    if (this.latch) {
      clearTimeout(this.latch.timer);
      this.latch = null;
    }
  }
}
