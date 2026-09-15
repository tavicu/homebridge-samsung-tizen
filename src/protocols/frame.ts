import WsClient, { RawData } from 'ws';
import { Device } from '../device/device.js';
import { sleep } from '../lib/tools.js';
import { FrameEvent } from '../types/index.js';

// Heartbeat timeout, 8 seconds (6 ping + 2 for safety)
const HEARTBEAT_TIMEOUT = 8 * 1000;

export class FrameSocket {
  private ws: WsClient | null = null;
  private url: string;
  private name: string;
  private id: string | null = null;
  private heartbeatTimeout?: NodeJS.Timeout;
  private connectionPromise: Promise<void> | null = null;

  constructor(private readonly device: Device) {
    this.name = Buffer.from('Homebridge').toString('base64');
    this.url = `wss://${this.device.config.ip}:8002/api/v2/channels/com.samsung.art-app?name=${this.name}`;

    this.device.once('paired', () => {
      if (!this.isSupported) {
        return;
      }

      this.start();

      this.device.on('state:update', (prop, value) => prop === 'power' && value && this.start());
    });
  }

  public get isSupported(): boolean {
    return !!this.device.storage.frameSupport;
  }

  public start(): void {
    if (!this.isSupported) {
      return;
    }

    this.refreshArtMode().catch(() => {});
  }

  public setArtMode(value: boolean): Promise<void> {
    return this.send('set_artmode_status', { value: value ? 'on' : 'off' });
  }

  public refreshArtMode(): Promise<void> {
    return this.send('get_artmode_status');
  }

  private async send(request: string, params: Record<string, any> = {}): Promise<void> {
    await this.ensureConnected();

    clearTimeout(this.heartbeatTimeout);

    return new Promise((resolve, reject) => {
      if (this.ws?.readyState !== WsClient.OPEN) {
        return reject(new Error('Socket is not open'));
      }

      const data = JSON.stringify({
        request,
        id: this.id || 'noop-id',
        ...params,
      });

      const payload = JSON.stringify({
        method: 'ms.channel.emit',
        params: {
          event: 'art_app_request',
          to: 'host',
          data,
        },
      });

      this.ws.send(payload, (error) => {
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
    const token = this.device.storage.token || '';

    return new Promise((resolve, reject) => {
      this.disconnect();

      const socket = new WsClient(`${this.url}&token=${token}`, {
        servername: '',
        handshakeTimeout: 2000,
        rejectUnauthorized: false,
      } as WsClient.ClientOptions);

      socket.on('close', () => {
        this.forgetSocket(socket);
        reject(new Error('Socket closed during connection'));
      });

      socket.on('ping', () => {
        this.startHeartbeat();
      });

      socket.on('error', (error) => {
        this.forgetSocket(socket);
        reject(error);
      });

      socket.on('message', (data: RawData) => {
        try {
          const response = JSON.parse(data.toString());

          if (response.event === 'ms.channel.connect') {
            this.id = response.data?.id || null;
          } else if (response.event === 'ms.channel.ready') {
            this.ws = socket;
            resolve();
          } else if (response.event === 'd2d_service_message') {
            this.handleMessage(response.data);
          } else if (response.event === 'ms.error') {
            this.device.log.debug(`[Frame] TV Error: ${response.data?.message}`);
          } else {
            if (response.event === 'ms.channel.unauthorized') {
              this.device.log.error('[Frame] TV rejected the WebSocket connection (unauthorized)');
            }

            reject(new Error(`Failed to open socket (${response.event})`));
          }
        } catch (e) {
          // Ignore JSON parsing errors for irrelevant messages
        }
      });
    });
  }

  private handleMessage(payload: string): void {
    try {
      const data = JSON.parse(payload);

      if (data.event === 'get_artmode_status') {
        this.device.emit('frame:artmode', data.value === 'on');
      } else if (data.event === 'art_mode_changed') {
        this.device.emit('frame:artmode', data.status === 'on');
      } else if (data.event === 'go_to_standby') {
        this.device.emit('frame:power', FrameEvent.STANDBY);
      } else if (data.event === 'wakeup') {
        this.device.emit('frame:power', FrameEvent.WAKEUP);
      }
    } catch {}
  }

  private forgetSocket(socket: WsClient) {
    if (this.ws !== socket) {
      return;
    }

    clearTimeout(this.heartbeatTimeout);
    this.ws = null;
    this.id = null;
  }

  private disconnect() {
    clearTimeout(this.heartbeatTimeout);
    this.ws?.terminate();
    this.ws = null;
    this.id = null;
  }

  private startHeartbeat() {
    clearTimeout(this.heartbeatTimeout);

    this.heartbeatTimeout = setTimeout(() => this.disconnect(), HEARTBEAT_TIMEOUT);
  }

  public destroy(): void {
    this.disconnect();
  }
}
