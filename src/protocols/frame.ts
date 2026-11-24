import WsClient, { RawData } from 'ws';
import { Device } from '../device/index.js';
import { trace } from '../lib/logger.js';
import { sleep, throttle } from '../lib/tools.js';
import { FrameEvent } from '../types/index.js';

const HEARTBEAT_TIMEOUT = 8 * 1000; // 6 ping + 2 for safety
const CONNECTION_TIMEOUT = 30 * 1000;
const ART_MODE_TTL = 2500;
// Debug build (#791): read-only requests sent once per connection, to see which parts of the art-app API the TV answers.
const PROBE_REQUESTS = ['get_api_version', 'api_version', 'get_device_info', 'get_artmode_status'];

export class FrameSocket {
  private ws: WsClient | null = null;
  private url: string;
  private name: string;
  private id: string | null = null;
  private lastArtModeUpdate = 0;
  private heartbeatTimeout?: NodeJS.Timeout;
  private connectionPromise: Promise<void> | null = null;

  constructor(private readonly device: Device) {
    this.name = Buffer.from('Homebridge').toString('base64');
    this.url = `wss://${this.device.config.ip}:8002/api/v2/channels/com.samsung.art-app?name=${this.name}`;

    this.device.once('paired', () => {
      trace(this.device.log, 'Frame', `Paired, Frame support: ${this.isSupported}`);

      if (!this.isSupported) {
        return;
      }

      this.start();

      this.device.on('state:update', (prop, value) => prop === 'power' && value && this.start());
    });
  }

  public get isSupported(): boolean {
    return this.device.isFrame;
  }

  public start(): void {
    if (!this.isSupported) {
      return;
    }

    this.ensureConnected().catch(() => {});
  }

  public setArtMode(value: boolean): Promise<void> {
    return this.send('set_artmode_status', { value: value ? 'on' : 'off' });
  }

  public refreshArtMode = throttle(() => {
    if (!this.device.power || Date.now() - this.lastArtModeUpdate < ART_MODE_TTL) {
      return;
    }

    this.send('get_artmode_status').catch(() => {});
  }, ART_MODE_TTL);

  private async send(request: string, params: Record<string, any> = {}): Promise<void> {
    if (!this.isSupported) {
      throw new Error('Frame is not supported for this device');
    }

    if (!this.device.power) {
      trace(this.device.log, 'Frame', `${request} not sent: TV is not powered on`);
      throw new Error('TV is not powered on');
    }

    await this.ensureConnected();

    clearTimeout(this.heartbeatTimeout);

    return new Promise((resolve, reject) => {
      if (this.ws?.readyState !== WsClient.OPEN) {
        trace(this.device.log, 'Frame', `${request} not sent: socket is not open`);
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

      trace(this.device.log, 'Frame', `Send: ${data}`);

      this.ws.send(payload, (error) => {
        if (error) {
          trace(this.device.log, 'Frame', `${request} write failed: ${error.message}`);
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
        this.probe();
      })
      .finally(() => {
        this.connectionPromise = null;
      });

    return this.connectionPromise;
  }

  private probe(): void {
    for (const request of PROBE_REQUESTS) {
      this.send(request).catch((error) => trace(this.device.log, 'Frame', `Probe ${request} failed: ${error.message}`));
    }
  }

  private connect(): Promise<void> {
    this.disconnect();

    const startedAt = Date.now();
    trace(this.device.log, 'Frame', 'Connecting');

    const socket = new WsClient(`${this.url}&token=${this.device.storage.token || ''}`, {
      servername: '',
      handshakeTimeout: 1000,
      rejectUnauthorized: false,
    } as WsClient.ClientOptions);

    return new Promise((resolve, reject) => {
      let settled = false;
      let timer: NodeJS.Timeout | undefined = undefined;

      const fail = (error: Error) => {
        this.forgetSocket(socket);

        if (settled) {
          trace(this.device.log, 'Frame', `Socket lost after connecting: ${error.message}`);
          return;
        }

        trace(this.device.log, 'Frame', `Connection failed after ${Date.now() - startedAt}ms: ${error.message}`);

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

      socket.on('open', () => trace(this.device.log, 'Frame', `WebSocket open after ${Date.now() - startedAt}ms`));
      socket.on('close', (code, reason) => {
        trace(this.device.log, 'Frame', `Socket closed (code ${code}${reason?.length ? `, reason ${reason.toString()}` : ''})`);
        fail(new Error('Socket closed during connection'));
      });
      socket.on('error', fail);
      socket.on('ping', () => this.startHeartbeat());

      socket.on('message', (data: RawData) => {
        this.startHeartbeat();

        try {
          const response = JSON.parse(data.toString());

          this.handleDebug(response);

          if (response.event === 'ms.channel.connect' || response.event === 'ms.channel.ready') {
            trace(this.device.log, 'Frame', `${response.event} after ${Date.now() - startedAt}ms`);
            this.id = response.data?.id || this.id || null;
            succeed();
            this.refreshArtMode();
          } else if (response.event === 'd2d_service_message') {
            this.handleMessage(response.data);
          } else if (response.event === 'ms.error') {
            this.device.log.debug(`[Frame] Error: ${response.data?.message}`);
          } else if (response.event === 'ms.channel.unauthorized') {
            this.device.log.error('[Frame] TV rejected the WebSocket connection (unauthorized)');
            fail(new Error(`Failed to open socket (${response.event})`));
          }
        } catch {
          trace(this.device.log, 'Frame', `Message that is not JSON: ${data.toString().slice(0, 500)}`);
        }
      });
    });
  }

  // Debug build (#791): every message from the art-app channel, not only the known events.
  private handleDebug(response: any): void {
    let data = response?.data;

    try {
      data = JSON.parse(data);
    } catch {}

    trace(this.device.log, 'Frame', `Received ${response?.event}: ${JSON.stringify(data ?? null).slice(0, 1000)}`);
  }

  private handleMessage(payload: string): void {
    try {
      const data = JSON.parse(payload);

      if (data.event === 'get_artmode_status' || data.event === 'artmode_status') {
        this.lastArtModeUpdate = Date.now();
        this.device.emit('frame:artmode', data.value === 'on');
      } else if (data.event === 'art_mode_changed') {
        this.lastArtModeUpdate = Date.now();
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

    this.heartbeatTimeout = setTimeout(() => {
      trace(this.device.log, 'Frame', 'Heartbeat timeout, disconnecting');
      this.disconnect();
    }, HEARTBEAT_TIMEOUT);
  }

  public destroy(): void {
    this.disconnect();
  }
}
