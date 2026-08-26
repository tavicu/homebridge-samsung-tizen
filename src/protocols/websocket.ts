import WsClient, { RawData } from 'ws';
import { Device } from '../device/device.js';
import { sleep } from '../lib/tools.js';

// Heartbeat timeout, 8 seconds (6 ping + 2 for safety)
const HEARTBEAT_TIMEOUT = 8 * 1000;

export class WebSocket {
  private ws: WsClient | null = null;
  private url: string;
  private name: string;
  private token: string | null = null;
  private heartbeatTimeout?: NodeJS.Timeout;
  private connectionPromise: Promise<void> | null = null;
  private pairRetries = 3;

  constructor(private readonly device: Device) {
    this.name = Buffer.from('Homebridge').toString('base64');
    this.url = `wss://${this.device.config.ip}:8002/api/v2/channels/samsung.remote.control?name=${this.name}`;

    this.startPairing()
      .then(() => this.device.emit('paired', { token: this.token || this.device.storage.token }))
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
        Option: false,
        TypeOfRemote: 'SendRemoteKey',
      },
    });
  }

  public async hold(key: string, duration: number) {
    await this.click(key, 'Press');
    await sleep(duration);
    await this.click(key, 'Release');
  }

  private async send(data: any): Promise<void> {
    await this.ensureConnected();

    clearTimeout(this.heartbeatTimeout);

    return new Promise((resolve, reject) => {
      if (this.ws?.readyState !== WsClient.OPEN) {
        return reject();
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

    return new Promise((resolve, reject) => {
      this.disconnect();

      const socket = new WsClient(connectionUrl, {
        handshakeTimeout: 750,
        rejectUnauthorized: false,
      });

      socket.on('close', () => {
        reject(new Error('Socket closed during connection'));
      });

      socket.on('ping', () => {
        this.startHeartbeat();
      });

      socket.on('error', (error) => {
        reject(error);
      });

      socket.on('message', (data: RawData) => {
        try {
          const response = JSON.parse(data.toString());

          if (response.event === 'ms.channel.connect') {
            this.ws = socket;
            resolve();

            if (response.data?.token) {
              this.token = response.data.token;
              this.device.storage.token = this.token || undefined;
            }
          } else if (response.event === 'ms.error') {
            // this.device.log?.debug?.(`[Remote] TV Error: ${response.data?.message}`);
          }
        } catch (e) {
          // Ignorăm erorile de parsare JSON pentru mesaje irelevante
        }
      });
    });
  }

  private async startPairing(): Promise<void> {
    if (this.device.storage.token) {
      return;
    }

    try {
      await this.pair();
    } catch (error) {
      if (this.pairRetries > 0) {
        this.pairRetries--;

        await sleep(3000);
        return await this.startPairing();
      } else {
        throw error;
      }
    }
  }

  private async pair() {
    if (!this.device.power) {
      throw new Error('TV is not powered on');
    }

    this.disconnect();

    await sleep(1000);
    await this.connect();
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
