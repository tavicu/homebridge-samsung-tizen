import axios from 'axios';
import { Device } from '../device/device.js';
import { SmartThingsNotAvailable } from '../errors.js';
import { SamsungPlatform } from '../platform.js';
import { SmartThingsClientState, SmartThingsCommand, SmartThingsDeviceStatus, SmartThingsPictureMode, SmartThingsRequestConfig, SmartThingsStorage } from '../types/index.js';

const STORAGE_KEY = 'smartthings';

const OAUTH_TOKEN_URL = 'https://api.smartthings.com/oauth/token';

export class SmartThingsManager {
  private storage!: SmartThingsStorage;
  private clientId: string | undefined;
  private clientSecret: string | undefined;

  public isAvailable: boolean = false;

  private refreshPromise: Promise<void> | null = null;
  private refreshTimer: NodeJS.Timeout | null = null;

  constructor(private platform: SamsungPlatform) {
    this.clientId = platform.config.clientId;
    this.clientSecret = platform.config.clientSecret;
  }

  public async start(): Promise<void> {
    if (!this.clientId || !this.clientSecret) {
      return;
    }

    this.storage = this.platform.storage.get(STORAGE_KEY);
    if (!this.storage?.accessToken) {
      this.platform.log.info('[SmartThings] No access token found. Follow the authorization flow...');
      return;
    }

    try {
      await this.ensureValidToken();
      this.scheduleRefresh();

      this.platform.log.info('[SmartThings] Successfully initialized and authenticated.');
    } catch (error: any) {
      this.platform.log.error(`[SmartThings] Failed initialization check: ${error.message}`);
      this.platform.log.info('[SmartThings] Please follow the authorization flow again...');
    }
  }

  private async ensureValidToken(): Promise<void> {
    const now = Date.now();

    // Refresh token if it's expiring in the next 30 minutes
    if (this.storage.expiresAt - now >= 30 * 60 * 1000) {
      this.isAvailable = true;
      return;
    }

    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.platform.log.debug('[SmartThings] Token is expiring soon or expired. Refreshing token...');

    this.refreshPromise = (async () => {
      try {
        await this.refreshAccessToken();

        this.isAvailable = true;
      } catch (error: any) {
        this.isAvailable = false;
        throw error;
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  private scheduleRefresh(): void {
    const now = Date.now();

    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }

    // Calculate exact time until the next 15 minutes before token expiration
    const delay = Math.max(this.storage.expiresAt - now - 15 * 60 * 1000, 0);

    this.refreshTimer = setTimeout(async () => {
      try {
        await this.ensureValidToken();
        this.scheduleRefresh();
      } catch (error: any) {
        this.platform.log.error(`[SmartThings] Background refresh token failed: ${error.message}`);
      }
    }, delay);
  }

  private async refreshAccessToken(): Promise<void> {
    const credentialsBase64 = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');

    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${credentialsBase64}`,
    };

    const response = await axios.post(
      OAUTH_TOKEN_URL,
      new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: this.storage.refreshToken,
      }).toString(),
      {
        headers,
      },
    );

    this.storage.accessToken = response.data.access_token;
    this.storage.refreshToken = response.data.refresh_token || this.storage.refreshToken;
    this.storage.expiresAt = Date.now() + response.data.expires_in * 1000;

    this.platform.log.debug('[SmartThings] Access token refreshed successfully');
  }

  public async send<T>(config: SmartThingsRequestConfig): Promise<T> {
    if (!this.isAvailable) {
      throw new SmartThingsNotAvailable();
    }

    await this.ensureValidToken();

    const { endpoint, commands } = config;

    const method = commands ? 'POST' : config.method || 'GET';
    const data = commands ? { commands: Array.isArray(commands) ? commands : [commands] } : undefined;

    const headers = { Authorization: `Bearer ${this.storage.accessToken}`, 'Content-Type': 'application/json' };

    try {
      const response = await axios({
        url: endpoint,
        method,
        headers,
        data,
      });

      if (response.data?.error) {
        throw new Error(response.data.error.message || response.data.error);
      }

      return response.data as T;
    } catch (error: any) {
      throw new Error(error.message, { cause: error });
    }
  }
}

export class SmartThingsClient {
  private deviceId: string | undefined;
  private apiStatusUrl: string;
  private apiCommandUrl: string;
  private readonly manager: SmartThingsManager;

  private state: SmartThingsClientState = {
    pictureMode: null,
    tvChannel: null,
    tvChannelName: null,
    inputSource: null,
  };
  private pictureModes: SmartThingsPictureMode[] = [];

  private lastUpdate = 0;
  private updatePromise: Promise<SmartThingsClientState> | null = null;

  constructor(
    private device: Device,
    platform: SamsungPlatform,
  ) {
    this.manager = platform.smartthingsManager;

    this.deviceId = this.device.config.deviceId || this.device.config.device_id;

    const apiBaseUrl = `https://api.smartthings.com/v1/devices/${this.deviceId}`;
    this.apiStatusUrl = `${apiBaseUrl}/status`;
    this.apiCommandUrl = `${apiBaseUrl}/commands`;
  }

  public get isAvailable(): boolean {
    return this.manager.isAvailable && !!this.deviceId;
  }

  private send<T>(config: SmartThingsRequestConfig): Promise<T> {
    if (!this.isAvailable) {
      return Promise.reject(new SmartThingsNotAvailable());
    }

    return this.manager.send<T>(config);
  }

  private command({ component = 'main', ...rest }: SmartThingsCommand): Promise<void> {
    return this.send({
      endpoint: this.apiCommandUrl,
      commands: { component, ...rest },
    });
  }

  private refresh(): Promise<void> {
    return this.command({ capability: 'refresh', command: 'refresh' });
  }

  public async getStatus(): Promise<SmartThingsClientState> {
    if (!this.isAvailable) {
      return this.state;
    }

    if (Date.now() - this.lastUpdate < 2500) {
      return this.state;
    }

    if (this.updatePromise) {
      return this.updatePromise;
    }

    this.updatePromise = (async () => {
      try {
        await this.refresh();
        const response = await this.send<SmartThingsDeviceStatus>({ endpoint: this.apiStatusUrl });
        const main = response.components?.main;
        const mediaInputSource = main?.['samsungvd.mediaInputSource'] || main?.mediaInputSource;
        const pictureModeSource = main?.['custom.picturemode'];
        const pictureModes = pictureModeSource?.supportedPictureModesMap?.value;

        this.lastUpdate = Date.now();
        this.pictureModes = Array.isArray(pictureModes) ? pictureModes : [];

        this.state = {
          tvChannel: main?.tvChannel?.tvChannel?.value || null,
          tvChannelName: main?.tvChannel?.tvChannelName?.value || null,
          inputSource: mediaInputSource?.inputSource?.value || null,
          pictureMode: pictureModeSource?.pictureMode?.value || null,
        };
      } catch (error) {
        this.device.log.error(`[SmartThings] Error updating status for device ${this.device.config.name}`, error);
      } finally {
        this.updatePromise = null;
      }

      return this.state;
    })();

    return this.updatePromise;
  }

  public async getInputSource(): Promise<string | null> {
    if (!this.isAvailable) {
      return null;
    }

    await this.getStatus();

    const { inputSource, tvChannelName, tvChannel } = this.state;

    if (!inputSource) {
      return null;
    }

    // It's an application if the tvChannelName includes a dot
    if (tvChannelName?.includes('.')) {
      return null;
    }

    if (!tvChannel && (inputSource === 'dtv' || inputSource === 'digitalTv')) {
      return null;
    }

    return inputSource;
  }

  public async getPictureMode(): Promise<string | null> {
    if (!this.isAvailable) {
      return null;
    }

    await this.getStatus();

    return this.pictureModes.find((mode) => mode.name === this.state.pictureMode)?.id || this.state.pictureMode;
  }

  public async getTvChannel(): Promise<string | null> {
    if (!this.isAvailable) {
      return null;
    }

    await this.getStatus();

    const { inputSource, tvChannelName, tvChannel } = this.state;

    // It's an application if the tvChannelName includes a dot
    if (tvChannelName?.includes('.')) {
      return null;
    }

    if (inputSource !== 'dtv' && inputSource !== 'digitalTv') {
      return null;
    }

    return tvChannel;
  }

  public setInputSource(value: string): Promise<void> {
    const capability = ['USB-C', 'Display Port'].includes(value) ? 'samsungvd.mediaInputSource' : 'mediaInputSource';

    return this.command({ capability, command: 'setInputSource', arguments: [value] });
  }

  public setPictureMode(value: string): Promise<void> {
    const pictureMode = this.pictureModes.find((mode) => mode.id === value)?.name || value;

    return this.command({ capability: 'custom.picturemode', command: 'setPictureMode', arguments: [pictureMode] });
  }

  public setTvChannel(value: string | number): Promise<void> {
    return this.command({ capability: 'tvChannel', command: 'setTvChannel', arguments: [value + ''] });
  }
}
