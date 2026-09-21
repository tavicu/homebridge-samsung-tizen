import dgram from 'dgram';
import { isIPv4, isIPv6 } from 'net';
import { networkInterfaces } from 'os';
import { WolOptions } from '../types/index.js';

function createWOLPacket(mac: string): Buffer {
  const cleanMac = mac.replace(/[^a-fA-F0-9]/g, '');

  if (cleanMac.length !== 12) {
    throw new Error(`Invalid MAC address: ${mac}`);
  }

  const macBuffer = Buffer.from(cleanMac, 'hex');
  const magicPacket = Buffer.alloc(102);

  magicPacket.fill(0xff, 0, 6);
  for (let i = 0; i < 16; i++) {
    macBuffer.copy(magicPacket, 6 + i * 6, 0, 6);
  }

  return magicPacket;
}

function getBroadcastAddr(ip: string, netmask: string): string {
  const ipOctets = ip.split('.').map(Number);
  const maskOctets = netmask.split('.').map(Number);
  const broadcast: number[] = [];

  for (let i = 0; i < ipOctets.length; i++) {
    broadcast.push((ipOctets[i] & maskOctets[i]) | (maskOctets[i] ^ 255));
  }

  return broadcast.join('.');
}

/* eslint-disable @typescript-eslint/no-use-before-define */
async function sendToAll(macAddress: string, options: WolOptions = {}): Promise<void> {
  const promises: Promise<void>[] = [];
  const interfaces = networkInterfaces();

  for (const name of Object.keys(interfaces)) {
    for (const netIf of interfaces[name] || []) {
      if (netIf.internal || !isIPv4(netIf.address) || !netIf.netmask) {
        continue;
      }

      promises.push(
        wol(macAddress, {
          ...options,
          from: netIf.address,
          address: getBroadcastAddr(netIf.address, netIf.netmask),
        }),
      );
    }
  }

  // Unicast to the TV IP bypasses router broadcast filters.
  if (options.ip) {
    promises.push(
      wol(macAddress, {
        ...options,
        from: '0.0.0.0', // Let the OS pick the best local interface automatically for this specific IP
        address: options.ip,
      }),
    );
  }

  const results = await Promise.allSettled(promises);

  const allFailed = results.every((result) => result.status === 'rejected');

  if (allFailed) {
    throw new Error('Wake-on-LAN failed.');
  }
}

export function wol(macAddress: string, options: WolOptions = {}): Promise<void> {
  if (!options.from) {
    return sendToAll(macAddress, options);
  }

  return new Promise((resolve, reject) => {
    try {
      const from = options.from;
      const port = options.port || 9;
      const address = options.address || '255.255.255.255';
      const interval = options.interval || 100;
      let count = options.count || 3;
      let intervalId: NodeJS.Timeout | undefined;

      const pkt = createWOLPacket(macAddress);

      const socket = dgram.createSocket(isIPv6(address) ? 'udp6' : 'udp4');

      const cleanup = () => {
        clearInterval(intervalId);
        socket.close();
      };

      const done = (err?: Error | null) => {
        count--;
        if (!count || err) {
          cleanup();
          if (err) {
            return reject(err);
          }
          return resolve();
        }
      };

      const doSend = () => {
        socket.send(pkt, 0, pkt.length, port, address, done);
      };

      try {
        socket.unref();
      } catch {}

      socket.once('error', (error) => {
        cleanup();
        reject(error);
      });

      socket.bind(0, from, () => {
        socket.setBroadcast(true);
        doSend();
        intervalId = setInterval(doSend, interval);
      });
    } catch (error) {
      return reject(error);
    }
  });
}
