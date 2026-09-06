import * as http from 'http';
import { isIPv4 } from 'net';
import { networkInterfaces } from 'os';
import { Device } from '../device/index.js';
import { parseUPnPChange, UPnPparser } from '../lib/parsers.js';
import { SamsungPlatform } from '../platform.js';
import { UPnPConfig } from '../types/index.js';

export class UPnPManager {
  private server: http.Server | null = null;
  private devices = new Map<string, Device>();
  private config: UPnPConfig;
  private localIp: string;
  private localPort: number = 0;

  private isServerReady: Promise<void>;
  private resolveServerReady!: () => void;

  constructor(private readonly platform: SamsungPlatform) {
    this.config = {
      port: 0,
      ...platform.config.upnp,
    };
    this.localIp = this.detectLocalIp();

    this.isServerReady = new Promise((resolve) => {
      this.resolveServerReady = resolve;
    });
  }

  public start() {
    this.platform.devices.forEach((device) => {
      this.devices.set(device.config.ip, device);
    });

    this.server = http.createServer((req, res) => {
      if (req.method === 'NOTIFY') {
        const urlObj = new URL(req.url || '', `http://${this.localIp}`);
        const deviceIp = urlObj.searchParams.get('ip');

        let body = '';

        req.on('data', (chunk) => {
          body += chunk;
        });

        req.on('end', () => {
          if (deviceIp && this.devices.has(deviceIp)) {
            try {
              const parsedBody = UPnPparser.parse(body);
              const lastChange = parsedBody.propertyset?.property?.LastChange;

              if (lastChange) {
                const eventData = parseUPnPChange(lastChange);

                this.devices.get(deviceIp)?.emit('upnp:update', eventData);
              }
            } catch (error: any) {
              this.platform.log.debug(`[UPnP] Failed to parse NOTIFY from ${deviceIp}: ${error.message || error}`);
            }
          }

          res.writeHead(200, { 'Content-Type': 'text/plain' });
          res.end('OK');
        });
      } else {
        res.writeHead(405);
        res.end();
      }
    });

    this.server.listen(this.config.port, () => {
      const addr = this.server?.address();
      this.localPort = addr && typeof addr !== 'string' ? addr.port : 0;
      this.platform.log.debug(`UPnP Manager server started on http://${this.localIp}:${this.localPort}`);

      this.resolveServerReady();
    });
  }

  public async getServerAddress(): Promise<{ ip: string; port: number }> {
    await this.isServerReady;
    return { ip: this.localIp, port: this.localPort };
  }

  private detectLocalIp(): string {
    const interfaces = networkInterfaces();

    for (const name of Object.keys(interfaces)) {
      const iface = interfaces[name];
      if (!iface) {
        continue;
      }

      for (const config of iface) {
        if (isIPv4(config.address) && !config.internal) {
          const ip = config.address;

          const isClassC = ip.startsWith('192.168.');
          const isClassA = ip.startsWith('10.');
          const isClassB = /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(ip); // 172.16.0.0 - 172.31.255.255

          if (isClassC || isClassA || isClassB) {
            return ip;
          }
        }
      }
    }

    return '127.0.0.1';
  }

  public destroy() {
    try {
      this.server?.closeAllConnections();
      this.server?.close();
    } catch {}
  }
}

export class UPnPClient {
  private readonly manager: UPnPManager;
  private readonly controlUrl: string;
  private readonly eventUrl: string;

  private subscriptionTimer: NodeJS.Timeout | null = null;
  private isSubscribing: boolean = false;
  private sid: string | null = null;

  constructor(
    private readonly device: Device,
    platform: SamsungPlatform,
  ) {
    const ip = this.device.config.ip;
    const port = '9197';

    this.manager = platform.upnpManager;

    this.controlUrl = `http://${ip}:${port}/upnp/control/RenderingControl1`;
    this.eventUrl = `http://${ip}:${port}/upnp/event/RenderingControl1`;

    this.device.on('state:update', (prop, value) => {
      if (prop === 'power' && value === true) {
        this.subscribeWithRetry();
      }
    });

    this.subscribeWithRetry();
  }

  private async subscribeWithRetry(): Promise<void> {
    if (this.isSubscribing) {
      return;
    }

    if (this.subscriptionTimer) {
      clearTimeout(this.subscriptionTimer);
    }

    this.isSubscribing = true;

    try {
      const serverAddr = await this.manager.getServerAddress();
      const callbackUrl = `<http://${serverAddr.ip}:${serverAddr.port}/?ip=${this.device.config.ip}>`;

      const response = await fetch(this.eventUrl, {
        method: 'SUBSCRIBE',
        headers: {
          CALLBACK: callbackUrl,
          NT: 'upnp:event',
          TIMEOUT: 'Second-300',
        },
        signal: AbortSignal.timeout(3000),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      this.sid = response.headers.get('sid');

      this.syncCurrentState();

      const timeoutHeader = response.headers.get('timeout') || 'Second-300';
      const seconds = parseInt(timeoutHeader.replace('Second-', ''), 10) || 300;
      const refreshTimeoutMs = (seconds - 30) * 1000; // Renew with 30 seconds before expiration

      this.isSubscribing = false;
      this.subscriptionTimer = setTimeout(() => {
        this.subscribeWithRetry();
      }, refreshTimeoutMs);
    } catch (err: any) {
      this.sid = null;
      this.isSubscribing = false;
      this.subscriptionTimer = setTimeout(() => this.subscribeWithRetry(), 15000);
    }
  }

  private async sendSoapAction(action: string, args: Record<string, any>): Promise<any> {
    const argsXml = Object.entries(args)
      .map(([k, v]) => `<${k}>${v}</${k}>`)
      .join('');

    const xmlBody = `<?xml version="1.0" encoding="utf-8"?>
    <s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/" s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">
        <s:Body>
            <u:${action} xmlns:u="urn:schemas-upnp-org:service:RenderingControl:1">
                ${argsXml}
            </u:${action}>
        </s:Body>
    </s:Envelope>`;

    const response = await fetch(this.controlUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset="utf-8"',
        SOAPACTION: `"urn:schemas-upnp-org:service:RenderingControl:1#${action}"`,
      },
      body: xmlBody,
      signal: AbortSignal.timeout(3000),
    });

    if (!response.ok) {
      throw new Error(`SOAP Action failed: ${response.status}`);
    }

    const textResp = await response.text();
    return UPnPparser.parse(textResp);
  }

  private async syncCurrentState() {
    try {
      const volume = await this.getVolume();
      const mute = await this.getMute();

      this.device.emit('upnp:update', { volume, mute });
    } catch (error: any) {
      this.device.log.debug(`[UPnP] Failed to sync volume/mute: ${error.message || error}`);
    }
  }

  public async getVolume(): Promise<number> {
    const resObj = await this.sendSoapAction('GetVolume', { InstanceID: 0, Channel: 'Master' });
    return parseInt(resObj.Envelope.Body.GetVolumeResponse.CurrentVolume, 10);
  }

  public async setVolume(volume: number): Promise<void> {
    const targetVolume = Math.max(0, Math.min(100, volume));
    await this.sendSoapAction('SetVolume', { InstanceID: 0, Channel: 'Master', DesiredVolume: targetVolume });
  }

  public async getMute(): Promise<boolean> {
    const resObj = await this.sendSoapAction('GetMute', { InstanceID: 0, Channel: 'Master' });
    const muteVal = resObj.Envelope.Body.GetMuteResponse.CurrentMute;
    return muteVal === 1 || muteVal === '1' || muteVal === true || muteVal === 'true';
  }

  public async setMute(mute: boolean): Promise<void> {
    await this.sendSoapAction('SetMute', { InstanceID: 0, Channel: 'Master', DesiredMute: mute ? 1 : 0 });
  }

  public destroy(): void {
    if (!this.sid) {
      return;
    }

    fetch(this.eventUrl, {
      method: 'UNSUBSCRIBE',
      headers: {
        SID: this.sid,
      },
      signal: AbortSignal.timeout(300),
    }).catch(() => void 0);
  }
}
