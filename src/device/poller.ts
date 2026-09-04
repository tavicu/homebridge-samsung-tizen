import type { Device } from './device.js';

const POLL_INTERVAL = 1000 * 15;

export class AccessoryPoller {
  private timer: NodeJS.Timeout | null = null;
  private busy = false;
  private paired = false;

  constructor(private readonly device: Device) {
    this.device.on('state:update', (prop) => {
      if (prop === 'power' && this.paired) {
        this.sync();
      }
    });
  }

  public destroy(): void {
    clearInterval(this.timer || undefined);
  }

  public sync(): void {
    this.paired = true;

    if (this.device.power) {
      this.start();
    } else {
      this.stop();
    }
  }

  private start(): void {
    if (this.timer) {
      return;
    }

    void this.tick();
    this.timer = setInterval(() => void this.tick(), POLL_INTERVAL);
  }

  private stop(): void {
    if (!this.timer) {
      return;
    }

    clearInterval(this.timer);
    this.timer = null;
  }

  private async tick(): Promise<void> {
    if (this.busy || !this.device.power) {
      return;
    }

    this.busy = true;

    try {
      await Promise.allSettled(this.device.accessories.flatMap((accessory) => Object.values(accessory.services).map((wrapper) => wrapper.pollValue())));
    } finally {
      this.busy = false;
    }
  }
}
