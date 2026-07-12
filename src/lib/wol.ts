import dgram from 'dgram';
import { isIPv4, isIPv6 } from 'net';
import { networkInterfaces } from 'os';
import { WolOptions } from '../types/index.js';

/**
 * Creates a standard Wake-on-LAN Magic Packet buffer.
 */
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

/**
 * Calculates the directed subnet broadcast address (e.g., 192.168.1.255).
 */
function getBroadcastAddr(ip: string, netmask: string): string {
  const ipOctets = ip.split('.').map(Number);
  const maskOctets = netmask.split('.').map(Number);
  const broadcast: number[] = [];

  for (let i = 0; i < ipOctets.length; i++) {
    broadcast.push((ipOctets[i] & maskOctets[i]) | (maskOctets[i] ^ 255));
  }

  return broadcast.join('.');
}

/**
 * Sends a Wake-on-LAN (Magic Packet) to all local subnet broadcast targets.
 */
/* eslint-disable @typescript-eslint/no-use-before-define */
async function sendToAll(macAddress: string, options: WolOptions = {}): Promise<void> {
  const promises: Promise<void>[] = [];
  const interfaces = networkInterfaces();

  // 1. Gather all local subnet broadcast targets
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

  // 2. Add the direct unicast IP target if provided (bypasses router broadcast filters)
  if (options.ip) {
    promises.push(
      wol(macAddress, {
        ...options,
        from: '0.0.0.0', // Let the OS pick the best local interface automatically for this specific IP
        address: options.ip,
      }),
    );
  }

  // 3. Wait for all transmission bursts to settle independently
  const results = await Promise.allSettled(promises);

  // 4. Verify if absolutely all routes failed
  const allFailed = results.every((result) => result.status === 'rejected');

  if (allFailed) {
    throw new Error('Wake-on-LAN failed.');
  }
}

/**
 * Sends a Wake-on-LAN (Magic Packet) to the specified MAC address.
 * Discovers and fires down all network paths simultaneously without explicit socket binding.
 */
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
