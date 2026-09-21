import WsClient, { RawData } from 'ws';
import { Device } from '../device/index.js';
import { parseInstalledApps } from '../lib/parsers.js';
import { retry, sleep } from '../lib/tools.js';

// Heartbeat timeout, 8 seconds (6 ping + 2 for safety)
const HEARTBEAT_TIMEOUT = 8 * 1000;
const CONNECTION_TIMEOUT = 30 * 1000;

export class WebSocket {
  private ws: WsClient | null = null;
  private url: string;
  private name: string;
  private token: string | null = null;
  private heartbeatTimeout?: NodeJS.Timeout;
  private connectionPromise: Promise<void> | null = null;

  constructor(private readonly device: Device) {
    this.name = Buffer.from('Homebridge').toString('base64');
    this.url = `wss://${this.device.config.ip}:8002/api/v2/channels/samsung.remote.control?name=${this.name}`;

    this.startPairing()
      .then(() => {
        this.device.emit('paired', { token: this.token || this.device.storage.token });
        this.getInstalledApps();
      })
      .catch((error) => {
        this.device.log.error(error.message);
        this.device.log.debug(error.stack);
      });
  }

  public async click(key: string, action: 'Click' | 'Press' | 'Release' = 'Click') {
    return this.send({
      method: 'ms.remote.control',
      params: {
        Cmd: action,
        DataOfCmd: key,
        Option: 'false',
        TypeOfRemote: 'SendRemoteKey',
      },
    });
  }

  public async hold(key: string, duration: number) {
    await this.click(key, 'Press');
    await sleep(duration);
    await this.click(key, 'Release');
  }

  private getInstalledApps() {
    this.send({
      method: 'ms.channel.emit',
      params: {
        event: 'ed.installedApp.get',
        to: 'host',
      },
    }).catch(() => {});
  }

  private async send(data: any): Promise<void> {
    await this.ensureConnected();

    clearTimeout(this.heartbeatTimeout);

    return new Promise((resolve, reject) => {
      if (this.ws?.readyState !== WsClient.OPEN) {
        return reject(new Error('Socket is not open'));
      }

      this.ws.send(JSON.stringify(data), (error) => {
        if (error) {
          return reject(new Error(error.message));
        }

        resolve();
      });
    });
  }

  private async ensureConnected(): Promise<void> {
    if (this.ws?.readyState === WsClient.OPEN) {
      return;
    }

    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = this.connect()
      .then(async () => {
        await sleep(250);
      })
      .finally(() => {
        this.connectionPromise = null;
      });

    return this.connectionPromise;
  }

  private connect(): Promise<void> {
    const token = this.token || this.device.storage.token || '';
    const connectionUrl = token ? `${this.url}&token=${token}` : this.url;

    this.disconnect();

    const socket = new WsClient(connectionUrl, {
      servername: '',
      handshakeTimeout: 750,
      rejectUnauthorized: false,
    } as WsClient.ClientOptions);

    return new Promise((resolve, reject) => {
      let settled = false;
      let timer: NodeJS.Timeout | undefined = undefined;

      const fail = (error: Error) => {
        this.forgetSocket(socket);

        if (settled) {
          return;
        }

        settled = true;
        clearTimeout(timer);
        socket.terminate();
        reject(error);
      };

      const succeed = () => {
        if (settled) {
          return;
        }

        settled = true;
        clearTimeout(timer);
        this.ws = socket;
        resolve();
      };

      timer = setTimeout(() => {
        fail(new Error('Timeout: TV accepted socket but never sent ready event'));
      }, CONNECTION_TIMEOUT);

      socket.on('close', () => fail(new Error('Socket closed during connection')));
      socket.on('error', fail);
      socket.on('ping', () => this.startHeartbeat());

      socket.on('message', (data: RawData) => {
        this.startHeartbeat();

        try {
          const response = JSON.parse(data.toString());

          if (response.event === 'ms.channel.connect') {
            if (response.data?.token) {
              this.token = response.data.token;
              this.device.storage.token = this.token || undefined;
            }

            succeed();
          } else if (response.event === 'ms.error') {
            this.device.log.debug(`[WS] Error: ${response.data?.message}`);
          } else if (response.event === 'ed.installedApp.get') {
            this.device.emit('apps:update', parseInstalledApps(response.data?.data));
          } else if (!settled) {
            if (response.event === 'ms.channel.unauthorized') {
              this.device.log.error('[WS] TV rejected the WebSocket connection (unauthorized)');
            }

            fail(new Error(`Failed to open socket (${response.event})`));
          }
        } catch (e) {
          // Ignore JSON parsing errors for irrelevant messages
        }
      });
    });
  }

  private async startPairing(): Promise<void> {
    if (this.device.storage.token) {
      return;
    }

    await retry(() => this.pair(), { retries: 3, delay: 3000 });
  }

  private async pair() {
    if (!this.device.power) {
      throw new Error('TV is not powered on');
    }

    this.disconnect();

    await sleep(1000);
    await this.connect();
  }

  private forgetSocket(socket: WsClient) {
    if (this.ws !== socket) {
      return;
    }

    clearTimeout(this.heartbeatTimeout);
    this.ws = null;
  }

  private disconnect() {
    clearTimeout(this.heartbeatTimeout);
    this.ws?.terminate();
    this.ws = null;
  }

  private startHeartbeat() {
    clearTimeout(this.heartbeatTimeout);

    this.heartbeatTimeout = setTimeout(() => this.disconnect(), HEARTBEAT_TIMEOUT);
  }

  public destroy(): void {
    this.disconnect();
  }
}
