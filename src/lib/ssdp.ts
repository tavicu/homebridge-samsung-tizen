import dgram, { RemoteInfo, Socket } from 'dgram';
import { EventEmitter } from 'events';
import { isIPv4 } from 'net';
import { networkInterfaces } from 'os';
import { SsdpHeaders, SsdpListenerEvents, SsdpListenerOptions, SsdpMessage } from '../types/index.js';

const SSDP_ADDRESS = '239.255.255.250';
const SSDP_PORT = 1900;
const SSDP_TTL = 4;
const SEARCH_MX = 2;
const SEARCH_REPEAT_DELAY = 100;
const INTERFACE_SCAN_INTERVAL = 1000 * 15;

function parseMessage(message: Buffer): SsdpMessage | undefined {
  const [startLine, ...lines] = message.toString().split(/\r?\n/);
  let type: SsdpMessage['type'];

  if (/^NOTIFY\s/i.test(startLine)) {
    type = 'notify';
  } else if (/^HTTP\/\d\.\d\s+200\b/i.test(startLine)) {
    type = 'found';
  } else {
    return undefined;
  }

  const headers: SsdpHeaders = {};

  for (const line of lines) {
    const separator = line.indexOf(':');

    if (separator > 0) {
      headers[line.slice(0, separator).trim().toUpperCase()] = line.slice(separator + 1).trim();
    }
  }

  return { type, headers };
}

function getInterfaceAddresses(): string[] {
  const addresses: string[] = [];
  const interfaces = networkInterfaces();

  for (const name of Object.keys(interfaces)) {
    for (const netIf of interfaces[name] || []) {
      if (!netIf.internal && isIPv4(netIf.address)) {
        addresses.push(netIf.address);
      }
    }
  }

  return addresses;
}

function closeSocket(socket?: Socket): void {
  try {
    socket?.close();
  } catch {}
}

export class SsdpListener extends EventEmitter<SsdpListenerEvents> {
  private readonly notifications: boolean;

  private ready = false;
  private scanInterval?: NodeJS.Timeout;

  // Receives the NOTIFY announcements sent to the multicast group.
  private multicastSocket?: Socket;
  private multicastListening = false;
  private multicastFailed = false;
  private memberships = new Set<string>();

  // One socket per interface, so a search goes out on every network and its replies come back on the same socket.
  private searchSockets = new Map<string, Socket>();

  // Failures already reported, so an interface that keeps failing is not reported again on every scan.
  private failures = new Set<string>();

  constructor(options: SsdpListenerOptions = {}) {
    super();

    this.notifications = options.notifications ?? true;
  }

  public start(): void {
    if (this.scanInterval) {
      return;
    }

    this.syncInterfaces();

    // Interfaces can show up after startup or change their address, and port 1900 can be busy at first.
    this.scanInterval = setInterval(() => this.syncInterfaces(), INTERFACE_SCAN_INTERVAL);
    this.scanInterval.unref();
  }

  public search(st: string): void {
    const message = Buffer.from(['M-SEARCH * HTTP/1.1', `HOST: ${SSDP_ADDRESS}:${SSDP_PORT}`, 'MAN: "ssdp:discover"', `MX: ${SEARCH_MX}`, `ST: ${st}`, '', ''].join('\r\n'));

    this.sendSearch(message);

    // UDP is not reliable and devices skip a search now and then, so each one goes out twice.
    setTimeout(() => this.sendSearch(message), SEARCH_REPEAT_DELAY).unref();
  }

  public close(): void {
    clearInterval(this.scanInterval);
    this.scanInterval = undefined;

    closeSocket(this.multicastSocket);
    this.multicastSocket = undefined;
    this.multicastListening = false;
    this.multicastFailed = false;
    this.memberships.clear();

    this.searchSockets.forEach((socket) => closeSocket(socket));
    this.searchSockets.clear();

    this.failures.clear();
    this.ready = false;
  }

  private openMulticastSocket(): void {
    const socket = dgram.createSocket({ type: 'udp4', reuseAddr: true });

    this.multicastSocket = socket;

    socket.on('message', this.onMessage.bind(this));
    socket.on('error', (error) => {
      closeSocket(socket);

      if (this.multicastSocket !== socket) {
        return;
      }

      // Drop the socket, the next interface scan opens a new one. Another program can hold port 1900 for a long time, so this is reported only once.
      this.multicastSocket = undefined;
      this.multicastListening = false;
      this.memberships.clear();

      if (!this.multicastFailed) {
        this.multicastFailed = true;
        this.reportError(error);
      }
    });

    socket.bind(SSDP_PORT, () => {
      if (this.multicastSocket !== socket) {
        return;
      }

      this.multicastListening = true;
      this.multicastFailed = false;
      this.syncInterfaces();
    });
  }

  private openSearchSocket(address: string): void {
    const socket = dgram.createSocket('udp4');

    this.searchSockets.set(address, socket);

    socket.on('message', this.onMessage.bind(this));
    socket.on('error', (error) => {
      closeSocket(socket);

      // Drop the socket, the next interface scan opens a new one.
      if (this.searchSockets.get(address) === socket) {
        this.searchSockets.delete(address);
        this.fail(address, 'socket', error);
      }
    });

    socket.bind(0, address, () => {
      if (this.searchSockets.get(address) !== socket) {
        return;
      }

      try {
        socket.setMulticastTTL(SSDP_TTL);
        socket.setMulticastInterface(address);
      } catch (error) {
        // Drop the socket, the next interface scan opens a new one.
        closeSocket(socket);
        this.searchSockets.delete(address);
        this.fail(address, 'socket', error);
        return;
      }

      this.recover(address, 'socket');

      if (!this.ready) {
        this.ready = true;
        this.emit('ready');
      }
    });
  }

  private syncInterfaces(): void {
    if (this.notifications && !this.multicastSocket) {
      this.openMulticastSocket();
    }

    const addresses = new Set(getInterfaceAddresses());

    for (const address of addresses) {
      if (!this.searchSockets.has(address)) {
        this.openSearchSocket(address);
      }

      if (this.multicastListening) {
        this.joinGroup(address);
      }
    }

    for (const [address, socket] of this.searchSockets) {
      if (!addresses.has(address)) {
        this.searchSockets.delete(address);
        closeSocket(socket);
      }
    }

    for (const address of this.memberships) {
      if (!addresses.has(address)) {
        this.memberships.delete(address);

        // The membership is usually gone together with the interface.
        try {
          this.multicastSocket?.dropMembership(SSDP_ADDRESS, address);
        } catch {}
      }
    }

    for (const key of this.failures) {
      if (!addresses.has(key.split(' ')[0])) {
        this.failures.delete(key);
      }
    }
  }

  private joinGroup(address: string): void {
    // Tried on every scan: the system can drop a membership when an interface goes down and comes back, and nothing reports that.
    try {
      this.multicastSocket?.addMembership(SSDP_ADDRESS, address);
    } catch (error) {
      // EADDRINUSE means the membership is still there.
      if (error.code !== 'EADDRINUSE') {
        this.fail(address, 'membership', error);
        return;
      }
    }

    this.memberships.add(address);
    this.recover(address, 'membership');
  }

  private sendSearch(message: Buffer): void {
    for (const [address, socket] of this.searchSockets) {
      const done = (error?: Error | null) => {
        if (this.searchSockets.get(address) !== socket) {
          return;
        }

        if (error) {
          this.fail(address, 'send', error);
        } else {
          this.recover(address, 'send');
        }
      };

      try {
        socket.send(message, SSDP_PORT, SSDP_ADDRESS, done);
      } catch (error) {
        done(error);
      }
    }
  }

  private fail(address: string, operation: string, error: Error): void {
    const key = `${address} ${operation}`;

    if (!this.failures.has(key)) {
      this.failures.add(key);
      this.reportError(error);
    }
  }

  private reportError(error: Error): void {
    // An 'error' event without a listener throws and would crash the process, so errors are reported only when someone listens.
    if (this.listenerCount('error') > 0) {
      this.emit('error', error);
    }
  }

  private recover(address: string, operation: string): void {
    this.failures.delete(`${address} ${operation}`);
  }

  private onMessage(message: Buffer, rinfo: RemoteInfo): void {
    const parsed = parseMessage(message);

    if (parsed) {
      this.emit(parsed.type, parsed.headers, { address: rinfo.address, port: rinfo.port });
    }
  }
}
