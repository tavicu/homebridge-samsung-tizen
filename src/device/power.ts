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

// How long an announcement keeps SSDP authoritative over the fallback. TVs advertise
// a max-age of 30 minutes, which would leave an unplugged TV showing as on for that long.
const SSDP_FRESH_LIMIT = 1000 * 60;

// The TV ignores any new command for ~3s after power on/off. Same window in which we
// trust our own optimistic guess over contradicting reports.
const POWERING_TIMEOUT = 1000 * 3;

/**
 * `device.power` is driven by SSDP first. Ping/PowerState is only a fallback for
 * when multicast never arrives, or when it goes silent without a byebye.
 */
export class PowerMonitor {
  private ssdpFreshUntil = 0;
  private latch: { value: boolean; expiresAt: number; timer: NodeJS.Timeout } | null = null;

  constructor(
    private readonly device: Device,
    private readonly probe: PowerProbe,
  ) {
    setInterval(() => void this.confirmViaPing('poll'), POLL_INTERVAL);

    this.device.on('ssdp:update', (event: SsdpEvent, maxAgeSeconds?: number) => {
      console.log('power:ssdp:update', this.device.config.ip, event, maxAgeSeconds ?? '');

      if (event === SsdpEvent.ALIVE) {
        void this.handleSsdpAlive(maxAgeSeconds);
      } else {
        this.handleSsdpByebye();
      }
    });
  }

  public get isPowering(): boolean {
    return this.latch !== null;
  }

  /** Call right after a power command, before the TV had any chance to confirm it. */
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

  /** Resolves once the TV is ready to accept commands again. */
  public async settled(): Promise<void> {
    if (this.latch) {
      await sleep(this.latch.expiresAt - Date.now());
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
    // Check if SSDP is still fresh
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

  /**
   * Caller already knows the TV is on the network (SSDP alive, or port 8001 open).
   * Some sets stay reachable in standby, so when they report PowerState, that decides.
   */
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
