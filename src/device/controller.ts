import axios from 'axios';
import isPortReachable from 'is-port-reachable';
import { TvOfflineError } from '../errors.js';
import { wol } from '../lib/wol.js';
import { COOLDOWN_TIMEOUT } from '../settings.js';
import { Device } from './device.js';

export class DeviceController {
  private sleepTimeout: NodeJS.Timeout | null = null;
  private cooldownTimer: NodeJS.Timeout | null = null;

  constructor(private device: Device) {
    // Get device info on startup
    this.getInfo().catch(() => {});
  }

  public ping(): Promise<boolean> {
    return isPortReachable(8001, {
      host: this.device.config.ip,
      timeout: 1000,
    });
  }

  public async getInfo(): Promise<any> {
    try {
      const { data } = await axios.get(`http://${this.device.config.ip}:8001/api/v2/`, { timeout: 1000 });

      // Update device storage
      if (data?.device) {
        const storage = this.device.storage;

        storage.firmware = data.version;
        storage.model = data.device.modelName;
        storage.frameSupport = data.device.FrameTVSupport === 'true';
        storage.tokenSupport = data.device.TokenAuthSupport === 'true';
      }

      return data;
    } catch (error: any) {
      throw new Error(error.message || error, { cause: error });
    }
  }

  public getSleep() {
    return this.sleepTimeout !== null;
  }

  public async setSleep(minutes: number, onComplete?: () => Promise<void> | void): Promise<void> {
    clearTimeout(this.sleepTimeout || undefined);
    this.sleepTimeout = null;

    if (!minutes) {
      return;
    }

    if (!this.device.power) {
      throw new TvOfflineError();
    }

    this.sleepTimeout = setTimeout(
      async () => {
        try {
          this.sleepTimeout = null;
          await this.powerOff();

          if (onComplete) {
            Promise.resolve(onComplete()).catch();
          }
        } catch (error: any) {
          this.device.log.error(`[Sleep] Failed to execute auto power off: ${error.message}`);
        }
      },
      1000 * 60 * minutes,
    );
  }

  public async setChannel(channel: number | string): Promise<void> {
    const channelStr = String(channel);

    if (!channel || !/^\d+$/.test(channelStr)) {
      throw new Error(`Invalid channel: ${channel}`);
    }

    const commands = channelStr.split('').map((char) => `KEY_${char}`);
    commands.push('KEY_ENTER');

    await this.device.sendCommand(commands);
  }

  /**
   * Get Application Information
   */
  public async getApplication(appId: string | number): Promise<any> {
    try {
      const response = await axios.get(`http://${this.device.config.ip}:8001/api/v2/applications/${appId}`, { timeout: 300 });

      return response.data;
    } catch (error: any) {
      throw new Error(error.message || error, { cause: error });
    }
  }

  /**
   * Launch Application
   */
  public async startApplication(appId: string | number): Promise<any> {
    try {
      const response = await axios.post(`http://${this.device.config.ip}:8001/api/v2/applications/${appId}`, null, { timeout: 300 });

      return response.data;
    } catch (error: any) {
      throw new Error(error.message || error, { cause: error });
    }
  }

  public async powerOn(): Promise<void> {
    if (this.cooldownTimer !== null) {
      throw new Error('TV is currently transitioning states. Please wait.');
    }

    if (this.device.power) {
      throw new Error('TV is already powered on');
    }

    const isSleeping = await this.ping();

    if (isSleeping) {
      await this.device.sendCommand('KEY_POWER');
    } else {
      await wol(this.device.config.mac, { ...this.device.config.wol, ip: this.device.config.ip }).catch((error) => {
        throw new Error('Failed to wake up TV', { cause: error });
      });
    }

    this.cooldownTimer = setTimeout(() => (this.cooldownTimer = null), COOLDOWN_TIMEOUT);
  }

  public async powerOff(): Promise<void> {
    if (this.cooldownTimer !== null) {
      throw new Error('TV is currently transitioning states. Please wait.');
    }

    if (!this.device.power) {
      throw new Error('TV is already powered off');
    }

    await this.device.sendCommand('KEY_POWER');

    this.cooldownTimer = setTimeout(() => (this.cooldownTimer = null), COOLDOWN_TIMEOUT);
  }
}
