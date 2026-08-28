import { promises as fs } from 'fs';
import { Buffer } from 'node:buffer';
import path from 'path';
import { HomebridgePluginUiServer } from '@homebridge/plugin-ui-utils';

class PluginUiServer extends HomebridgePluginUiServer {
  constructor() {
    super();

    this.storagePath = path.join(this.homebridgeStoragePath, 'accessories', 'samsung-tizen.json');

    this.onRequest('/smartthings/auth-url', this.authUrl.bind(this));
    this.onRequest('/smartthings/auth-token', this.authToken.bind(this));
    this.onRequest('/smartthings/save-token', this.saveToken.bind(this));
    this.onRequest('/smartthings/get-token', this.getToken.bind(this));

    this.ready();
  }

  async authUrl(config) {
    const { clientId, clientSecret } = config;

    if (!clientId || !clientSecret) {
      throw new Error('Client ID and client secret are required');
    }

    const redirectUrl = 'https://httpbin.org/get';
    const scopes = 'r:devices:* x:devices:*'.replace(' ', '%20');

    return `https://api.smartthings.com/oauth/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUrl)}&scope=${scopes}`;
  }

  async authToken(config) {
    const { clientId, clientSecret, authorizationCode } = config;

    if (!clientId || !clientSecret || !authorizationCode) {
      throw new Error('Client ID, client secret, and authorization code are required');
    }

    const redirectUrl = 'https://httpbin.org/get';
    const credentialsBase64 = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code: authorizationCode,
      redirect_uri: redirectUrl,
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

  async saveToken(data) {
    const storedData = await this.getStoredData();

    storedData.smartthings = {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: Date.now() + data.expires_in * 1000,
    };

    await fs.writeFile(this.storagePath, JSON.stringify(storedData, null, 2), 'utf-8');

    return storedData;
  }

  async getToken() {
    const storedData = await this.getStoredData();
    const stData = storedData?.smartthings;

    return Object.keys(stData || {}).length ? stData : null;
  }

  async getStoredData() {
    try {
      const data = await fs.readFile(this.storagePath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      return {};
    }
  }
}

new PluginUiServer();
