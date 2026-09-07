import { promises as fs } from 'fs';
import { Buffer } from 'node:buffer';
import path from 'path';
import { HomebridgePluginUiServer } from '@homebridge/plugin-ui-utils';

class PluginUiServer extends HomebridgePluginUiServer {
  #storagePath;
  #backupDir;

  constructor() {
    super();

    this.#storagePath = path.join(this.homebridgeStoragePath, 'accessories', 'samsung-tizen.json');
    this.#backupDir = path.join(this.homebridgeStoragePath, 'backups', 'samsung-tizen');

    this.onRequest('/smartthings/auth-url', this.stAuthUrl.bind(this));
    this.onRequest('/smartthings/auth-token', this.stAuthToken.bind(this));
    this.onRequest('/smartthings/save-token', this.stSaveToken.bind(this));
    this.onRequest('/smartthings/get-token', this.stGetToken.bind(this));
    this.onRequest('/smartthings/disconnect', this.stDisconnect.bind(this));
    this.onRequest('/smartthings/get-devices', this.stGetDevices.bind(this));
    this.onRequest('/device/get-info', this.deviceGetInfo.bind(this));

    this.ready();
  }

  async stAuthUrl(config) {
    const { clientId, clientSecret, redirectUrl } = config;

    if (!clientId || !clientSecret) {
      throw new Error('Client ID and client secret are required');
    }

    const resolvedRedirectUrl = this.#resolveRedirectUrl(redirectUrl);
    const scopes = 'r:devices:* x:devices:*'.replace(' ', '%20');

    return `https://api.smartthings.com/oauth/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(resolvedRedirectUrl)}&scope=${scopes}`;
  }

  async stAuthToken(config) {
    const { clientId, clientSecret, authorizationCode, redirectUrl } = config;

    if (!clientId || !clientSecret || !authorizationCode) {
      throw new Error('Client ID, client secret, and authorization code are required');
    }

    const resolvedRedirectUrl = this.#resolveRedirectUrl(redirectUrl);
    const credentialsBase64 = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code: authorizationCode,
      redirect_uri: resolvedRedirectUrl,
    });

    const response = await fetch('https://api.smartthings.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${credentialsBase64}`,
      },
      body: body.toString(),
    });

    const data = await response.json();
    return data;
  }

  async stSaveToken(data) {
    const storedData = await this.#patchStoredData({
      smartthings: {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt: Date.now() + data.expires_in * 1000,
      },
    });

    return storedData;
  }

  async stGetToken() {
    const storedData = await this.#readStoredData();
    const stData = storedData?.smartthings;

    return Object.keys(stData || {}).length ? stData : null;
  }

  async stDisconnect() {
    await this.#patchStoredData({ smartthings: undefined });

    return null;
  }

  async stGetDevices() {
    const stData = await this.stGetToken();

    if (!stData?.accessToken) {
      return [];
    }

    try {
      const response = await fetch('https://api.smartthings.com/v1/devices', {
        headers: { Authorization: `Bearer ${stData.accessToken}` },
      });

      const data = await response.json();
      const tvCapabilities = ['tvChannel', 'mediaInputSource', 'samsungvd.mediaInputSource', 'custom.picturemode'];

      return (data.items || [])
        .filter((item) => item.components?.some((component) => component.capabilities?.some((capability) => tvCapabilities.includes(capability.id))))
        .map((item) => ({ deviceId: item.deviceId, name: item.label || item.name }));
    } catch {
      return [];
    }
  }

  async deviceGetInfo({ ip } = {}) {
    try {
      const response = await fetch(`http://${ip}:8001/api/v2/`, {
        signal: AbortSignal.timeout(3000),
        redirect: 'error',
      });

      if (!response.ok) {
        return { reachable: false };
      }

      const data = await response.json().catch(() => null);

      return {
        reachable: true,
        mac: data?.device?.wifiMac || null,
        tokenSupport: data?.device?.TokenAuthSupport === 'true',
      };
    } catch {
      return { reachable: false };
    }
  }

  #resolveRedirectUrl(redirectUrl) {
    if (typeof redirectUrl === 'string' && redirectUrl.trim()) {
      return redirectUrl.trim();
    }

    return 'https://tavicu.github.io/homebridge-samsung-tizen/token.html';
  }

  async #readStoredData() {
    let raw;

    try {
      raw = await fs.readFile(this.#storagePath, 'utf-8');
    } catch (error) {
      if (error.code === 'ENOENT') {
        return {};
      }

      throw error;
    }

    try {
      const parsed = JSON.parse(raw);

      if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new Error('Plugin storage file is not a valid JSON object');
      }

      return parsed;
    } catch (error) {
      error.code = 'EBADCACHE';
      throw error;
    }
  }

  async #patchStoredData(partial) {
    await fs.mkdir(path.dirname(this.#storagePath), { recursive: true });

    let storedData;

    try {
      storedData = await this.#readStoredData();
    } catch (error) {
      if (error.code !== 'EBADCACHE') {
        throw error;
      }

      // Unreadable content can never be merged and retrying will not fix it, so keep the
      // file aside for manual recovery instead of blocking the write on it.
      await fs.rename(this.#storagePath, `${this.#storagePath}.invalid.${Date.now()}`);
      storedData = {};
    }

    const nextData = Object.fromEntries(Object.entries({ ...storedData, ...partial }).filter(([, value]) => value !== undefined));
    const tmpPath = `${this.#storagePath}.tmp`;

    try {
      await this.#backupStoredData();

      await fs.writeFile(tmpPath, JSON.stringify(nextData, null, 2), 'utf-8');
      await fs.rename(tmpPath, this.#storagePath);
    } catch (error) {
      await fs.unlink(tmpPath).catch(() => {});
      throw error;
    }

    return nextData;
  }

  async #backupStoredData() {
    try {
      await fs.mkdir(this.#backupDir, { recursive: true });

      const backupPath = path.join(this.#backupDir, `${path.basename(this.#storagePath)}.${Date.now()}`);
      await fs.copyFile(this.#storagePath, backupPath);

      await this.#pruneStoredBackups();
    } catch {
      // Backups are best-effort and should never block writing the actual data.
    }
  }

  async #pruneStoredBackups() {
    const maxBackups = 10;
    const prefix = `${path.basename(this.#storagePath)}.`;
    const entries = await fs.readdir(this.#backupDir);

    const backups = entries.filter((entry) => entry.startsWith(prefix)).sort((a, b) => Number(a.slice(prefix.length)) - Number(b.slice(prefix.length)));
    const outdated = backups.slice(0, Math.max(0, backups.length - maxBackups));

    await Promise.all(outdated.map((entry) => fs.unlink(path.join(this.#backupDir, entry)).catch(() => {})));
  }
}

new PluginUiServer();
