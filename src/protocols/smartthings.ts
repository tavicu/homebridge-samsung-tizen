import axios from 'axios';
import { Device } from '../device/device.js';
import { SmartThingsNotAvailable } from '../errors.js';
import { SamsungPlatform } from '../platform.js';
import { SmartThingsClientState, SmartThingsRequestConfig, SmartThingsStorage } from '../types/index.js';

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
        this.storage.clear();
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

  public async send<T = any>(config: SmartThingsRequestConfig): Promise<T> {
    if (!this.isAvailable) {
      throw new SmartThingsNotAvailable();
    }

    await this.ensureValidToken();

    const { endpoint, commands } = config;

    const method = commands ? 'POST' : config.method || 'GET';

    let data: any = undefined;
    if (commands) {
      const payload = Array.isArray(commands) ? commands : [commands];
      data = { commands: payload };
    }

    const headers = { Authorization: `Bearer ${this.storage.accessToken}`, 'Content-Type': 'application/json' };

    try {
      const response = await axios({
        url: endpoint,
        method,
        headers,
        data,
      });

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      return response.data as T;
    } catch (error: any) {
      throw new Error(error.message, { cause: error });
    }
  }
}

export class SmartThingsClient {
  private deviceId: string | undefined;
  private apiBaseUrl: string;
  private apiStatesUrl: string;
  private apiCommandUrl: string;
  private readonly manager: SmartThingsManager;

  private state: SmartThingsClientState = {
    pictureMode: null,
    tvChannel: null,
    tvChannelName: null,
    inputSource: null,
  };

  private lastUpdate = 0;
  private updatePromise: Promise<SmartThingsClientState> | null = null;

  constructor(
    private device: Device,
    platform: SamsungPlatform,
  ) {
    this.manager = platform.smartthingsManager;

    this.deviceId = this.device.config.deviceId || this.device.config.device_id;
    this.apiBaseUrl = `https://api.smartthings.com/v1/devices/${this.deviceId}`;
    this.apiStatesUrl = `${this.apiBaseUrl}/states`;
    this.apiCommandUrl = `${this.apiBaseUrl}/commands`;
  }

  public get isAvailable(): boolean {
    return this.manager.isAvailable && !!this.deviceId;
  }

  private send<T = any>(config: SmartThingsRequestConfig): Promise<T> {
    if (!this.isAvailable) {
      return Promise.reject(new SmartThingsNotAvailable());
    }

    return this.manager.send<T>(config);
  }

  private refresh(): Promise<any> {
    return this.send({
      endpoint: this.apiCommandUrl,
      commands: { component: 'main', capability: 'refresh', command: 'refresh' },
    });
  }

  public async getStatus(): Promise<SmartThingsClientState> {
    if (!this.isAvailable) {
      return this.state;
    }

    const now = Date.now();

    if (now - this.lastUpdate < 2500) {
      return this.state;
    }

    if (this.updatePromise) {
      return this.updatePromise;
    }

    this.updatePromise = (async () => {
      try {
        await this.refresh();
        const response = await this.send({ endpoint: this.apiStatesUrl });

        this.state = {
          tvChannel: response.main?.tvChannel?.value || null,
          tvChannelName: response.main?.tvChannelName?.value || null,
          inputSource: response.main?.inputSource?.value || null,
          pictureMode: response.main?.pictureMode?.value || null,
        };

        this.lastUpdate = Date.now();
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

    let finalValue = inputSource;

    if (finalValue === 'dtv') {
      finalValue = 'digitalTv';
    }

    // It's an application if the tvChannelName includes a dot
    if (tvChannelName?.includes('.')) {
      return null;
    }

    // digitalTv should have a valid channel
    if (!tvChannel && finalValue === 'digitalTv') {
      return null;
    }

    return finalValue;
  }

  public async getPictureMode(): Promise<string | null> {
    if (!this.isAvailable) {
      return null;
    }

    await this.getStatus();
    return this.state.pictureMode;
  }

  public setInputSource(value: string): Promise<any> {
    const capability = ['USB-C', 'Display Port'].includes(value) ? 'samsungvd.mediaInputSource' : 'mediaInputSource';

    return this.send({
      endpoint: this.apiCommandUrl,
      commands: { component: 'main', capability: capability, command: 'setInputSource', arguments: [value] },
    });
  }

  public setPictureMode(value: string): Promise<any> {
    return this.send({
      endpoint: this.apiCommandUrl,
      commands: { component: 'main', capability: 'custom.picturemode', command: 'setPictureMode', arguments: [value] },
    });
  }

  public setTvChannel(value: string | number): Promise<any> {
    return this.send({
      endpoint: this.apiCommandUrl,
      commands: { component: 'main', capability: 'tvChannel', command: 'setTvChannel', arguments: [value + ''] },
    });
  }
}
