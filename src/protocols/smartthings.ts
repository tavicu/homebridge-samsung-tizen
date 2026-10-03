import axios from 'axios';
import { Device } from '../device/index.js';
import { SmartThingsNotAvailable } from '../errors.js';
import { SamsungPlatform } from '../platform.js';
import {
  SmartThingsAttribute,
  SmartThingsClientState,
  SmartThingsCommand,
  SmartThingsDeviceStatus,
  SmartThingsModeMap,
  SmartThingsRequestConfig,
  SmartThingsStorage,
} from '../types/index.js';

const STORAGE_KEY = 'smartthings';

const OAUTH_TOKEN_URL = 'https://api.smartthings.com/oauth/token';
const MAX_STATE_AGE = 24 * 60 * 60 * 1000;
const REQUEST_TIMEOUT = 5 * 1000;
const RETRY_DELAYS = [60 * 1000, 5 * 60 * 1000, 15 * 60 * 1000, 30 * 60 * 1000, 60 * 60 * 1000];

function parseStateValue(attr?: SmartThingsAttribute): string | null {
  const value = attr?.value || null;

  if (!value || !attr?.timestamp) {
    return value;
  }

  const updatedAt = Date.parse(attr.timestamp);
  if (Number.isNaN(updatedAt) || Date.now() - updatedAt > MAX_STATE_AGE) {
    return null;
  }

  return value;
}

// The token endpoint answering 400/401 means the refresh token was rejected; retrying will not fix it.
function isAuthorizationRejected(error: any): boolean {
  const status = error?.response?.status;
  return status === 400 || status === 401;
}

export class SmartThingsManager {
  private storage!: SmartThingsStorage;
  private clientId: string | undefined;
  private clientSecret: string | undefined;

  private available = false;

  private refreshPromise: Promise<void> | null = null;
  private refreshTimer: NodeJS.Timeout | null = null;
  private retryAttempt = 0;

  constructor(private platform: SamsungPlatform) {
    this.clientId = platform.config.clientId;
    this.clientSecret = platform.config.clientSecret;
  }

  public get isAvailable(): boolean {
    // A new authorization from the configuration interface comes with a valid token
    if (!this.available && this.storage) {
      void this.storage.reload().then(() => this.hasValidToken() && this.authenticate());
    }

    return this.available;
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

    if (await this.authenticate()) {
      this.platform.log.info('[SmartThings] Successfully initialized and authenticated.');
    }
  }

  private async authenticate(): Promise<boolean> {
    try {
      await this.ensureValidToken();

      this.retryAttempt = 0;
      this.scheduleRefresh();

      return true;
    } catch {
      return false;
    }
  }

  private async ensureValidToken(): Promise<void> {
    if (this.hasValidToken()) {
      this.available = true;
      return;
    }

    this.platform.log.debug('[SmartThings] Token is expiring soon or expired. Refreshing token...');

    return this.refreshToken();
  }

  // Refresh token if it's expiring in the next 30 minutes
  private hasValidToken(): boolean {
    return this.storage.expiresAt - Date.now() >= 30 * 60 * 1000;
  }

  private refreshToken(): Promise<void> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = (async () => {
      try {
        await this.refreshAccessToken();

        this.available = true;
      } catch (error: any) {
        this.available = false;

        // A rejected refresh token needs a new authorization; anything else (network, timeout) is retried.
        if (isAuthorizationRejected(error)) {
          // Marked as expired, so only a new authorization makes SmartThings available again.
          this.storage.expiresAt = 0;
          clearTimeout(this.refreshTimer || undefined);
          this.platform.log.error(`[SmartThings] Authorization was rejected: ${error.message}`);
          this.platform.log.info('[SmartThings] Please follow the authorization flow again...');
        } else {
          this.platform.log.error(`[SmartThings] Could not refresh the access token: ${error.message}`);
          this.scheduleRetry();
        }

        throw error;
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  private scheduleRefresh(): void {
    // Calculate exact time until the next 15 minutes before token expiration
    const delay = Math.max(this.storage.expiresAt - Date.now() - 15 * 60 * 1000, 0);

    this.setTimer(delay);
  }

  private scheduleRetry(): void {
    const delay = RETRY_DELAYS[Math.min(this.retryAttempt, RETRY_DELAYS.length - 1)];

    this.retryAttempt++;
    this.platform.log.info(`[SmartThings] Retrying in ${Math.round(delay / 60000)} minute(s)...`);

    this.setTimer(delay);
  }

  private setTimer(delay: number): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }

    this.refreshTimer = setTimeout(() => void this.authenticate(), delay);
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
        timeout: REQUEST_TIMEOUT,
      },
    );

    this.storage.accessToken = response.data.access_token;
    this.storage.refreshToken = response.data.refresh_token || this.storage.refreshToken;
    this.storage.expiresAt = Date.now() + response.data.expires_in * 1000;

    this.platform.log.debug('[SmartThings] Access token refreshed successfully');
  }

  public async send<T>(config: SmartThingsRequestConfig, isRetry = false): Promise<T> {
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
        timeout: REQUEST_TIMEOUT,
      });

      if (response.data?.error) {
        throw new Error(response.data.error.message || response.data.error);
      }

      return response.data as T;
    } catch (error: any) {
      // The access token was revoked or expired early: refresh it once and repeat the request.
      if (error.response?.status === 401 && !isRetry) {
        await this.refreshToken();
        return this.send<T>(config, true);
      }

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
    soundMode: null,
    tvChannel: null,
    tvChannelName: null,
    inputSource: null,
  };
  private pictureModes: SmartThingsModeMap[] = [];
  private soundModes: SmartThingsModeMap[] = [];

  private lastUpdate = 0;
  private updatePromise: Promise<SmartThingsClientState> | null = null;

  constructor(
    private device: Device,
    platform: SamsungPlatform,
  ) {
    this.manager = platform.smartthingsManager;

    this.deviceId = this.device.config.deviceId;

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
        const soundModeSource = main?.['custom.soundmode'];
        const soundModes = soundModeSource?.supportedSoundModesMap?.value;

        this.lastUpdate = Date.now();
        this.pictureModes = Array.isArray(pictureModes) ? pictureModes : [];
        this.soundModes = Array.isArray(soundModes) ? soundModes : [];

        this.state = {
          tvChannel: parseStateValue(main?.tvChannel?.tvChannel),
          tvChannelName: parseStateValue(main?.tvChannel?.tvChannelName),
          inputSource: parseStateValue(mediaInputSource?.inputSource),
          pictureMode: parseStateValue(pictureModeSource?.pictureMode),
          soundMode: parseStateValue(soundModeSource?.soundMode),
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

    // A tuner with no channel is not a selectable input.
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

  public async getSoundMode(): Promise<string | null> {
    if (!this.isAvailable) {
      return null;
    }

    await this.getStatus();

    return this.soundModes.find((mode) => mode.name === this.state.soundMode)?.id || this.state.soundMode;
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

  public setPower(value: boolean): Promise<void> {
    return this.command({ capability: 'switch', command: value ? 'on' : 'off' });
  }

  public setInputSource(value: string): Promise<void> {
    const capability = ['USB-C', 'Display Port'].includes(value) ? 'samsungvd.mediaInputSource' : 'mediaInputSource';
    const source = value === 'dtv' ? 'digitalTv' : value;

    return this.command({ capability, command: 'setInputSource', arguments: [source] });
  }

  public setPictureMode(value: string): Promise<void> {
    const pictureMode = this.pictureModes.find((mode) => mode.id === value)?.name || value;

    return this.command({ capability: 'custom.picturemode', command: 'setPictureMode', arguments: [pictureMode] });
  }

  public setSoundMode(value: string): Promise<void> {
    const soundMode = this.soundModes.find((mode) => mode.id === value)?.name || value;

    return this.command({ capability: 'custom.soundmode', command: 'setSoundMode', arguments: [soundMode] });
  }

  public setTvChannel(value: string | number): Promise<void> {
    return this.command({ capability: 'tvChannel', command: 'setTvChannel', arguments: [value + ''] });
  }
}
