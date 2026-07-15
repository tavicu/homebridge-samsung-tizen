import axios from 'axios';
import isPortReachable from 'is-port-reachable';
import { TvOfflineError } from '../errors.js';
import { parseCommands } from '../lib/parsers.js';
import { delay } from '../lib/tools.js';
import { wol } from '../lib/wol.js';
import { SamsungPlatform } from '../platform.js';
import { SmartThingsClient, UPnPClient, WebSocket } from '../protocols/index.js';
import { Device } from './device.js';

const POWERING_TIMEOUT = 1000 * 3;

export class DeviceController {
  private ws: WebSocket;
  private upnp: UPnPClient;
  private smartthings: SmartThingsClient;

  private sleepTimeout: NodeJS.Timeout | null = null;
  private poweringTimeout: NodeJS.Timeout | null = null;

  constructor(
    private device: Device,
    platform: SamsungPlatform,
  ) {
    this.ws = new WebSocket(this.device);
    this.upnp = new UPnPClient(this.device, platform);
    this.smartthings = new SmartThingsClient(this.device, platform);

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
    const fetchInfo = async () => {
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
    };

    return this.device.cache.get('device-info', fetchInfo, 5000);
  }

  public async setMute(value: boolean): Promise<void> {
    await this.waitPowering();
    return this.upnp.setMute(value);
  }

  public async setVolume(value: number): Promise<void> {
    await this.waitPowering();
    return this.upnp.setVolume(value);
  }

  public getInputSource(): Promise<string | null> {
    return this.smartthings.getInputSource();
  }

  public async setInputSource(value: string): Promise<void> {
    await this.waitPowering();
    return this.smartthings.setInputSource(value);
  }

  public getPictureMode(): Promise<string | null> {
    return this.smartthings.getPictureMode();
  }

  public async setPictureMode(value: string): Promise<void> {
    await this.waitPowering();
    return this.smartthings.setPictureMode(value);
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

    await this.waitPowering();

    this.sleepTimeout = setTimeout(
      async () => {
        try {
          this.sleepTimeout = null;

          if (this.device.power) {
            await this.device.setPower(false);
          }

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
    await this.waitPowering();

    const channelStr = String(channel);

    if (!channel || !/^\d+$/.test(channelStr)) {
      throw new Error(`Invalid channel: ${channel}`);
    }

    if (this.smartthings.isAvailable) {
      await this.smartthings.setTvChannel(channel);
    } else {
      const commands = channelStr.split('').map((char) => `KEY_${char}`);
      commands.push('KEY_ENTER');

      await this.device.sendCommand(commands);
    }
  }

  public async getApplication(appId: string | number): Promise<any> {
    const fetchApp = async () => {
      const response = await axios.get(`http://${this.device.config.ip}:8001/api/v2/applications/${appId}`, { timeout: 300 });
      return response.data;
    };

    return this.device.cache.get(`app-${appId}`, fetchApp, 1000);
  }

  public async startApplication(appId: string | number): Promise<any> {
    await this.waitPowering();

    // TODO: check data.code when invalid app id is provided

    const response = await axios.post(`http://${this.device.config.ip}:8001/api/v2/applications/${appId}`, null, { timeout: 300 });
    return response.data;
  }

  public async sendCommand(commands: string | string[]): Promise<void> {
    await this.waitPowering();

    const parsed = parseCommands(commands);

    for (const [i, cmd] of parsed.entries()) {
      if (typeof cmd === 'object') {
        await this.ws.hold(cmd.key, cmd.time * 1000);
      } else {
        await this.ws.click(cmd);
      }

      if (i < parsed.length - 1) {
        await delay(400);
      }
    }
  }

  public async powerOn(): Promise<void> {
    if (this.poweringTimeout !== null) {
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

    this.poweringTimeout = setTimeout(() => (this.poweringTimeout = null), POWERING_TIMEOUT);
  }

  public async powerOff(): Promise<void> {
    if (this.poweringTimeout !== null) {
      throw new Error('TV is currently transitioning states. Please wait.');
    }

    if (!this.device.power) {
      throw new Error('TV is already powered off');
    }

    await this.device.sendCommand('KEY_POWER');

    this.poweringTimeout = setTimeout(() => (this.poweringTimeout = null), POWERING_TIMEOUT);
  }

  private async waitPowering(): Promise<void> {
    while (this.poweringTimeout !== null) {
      await delay(200);
    }
  }

  public destroy(): void {
    this.ws.destroy();
    this.upnp.destroy();
  }
}
