import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import { EventEmitter } from 'node:events';
import { mock, test } from 'node:test';
import { URL } from 'node:url';

const TOKEN = 'synthetic-tv-token';
const CLIENT_TOKEN = 'synthetic-client-token';
const sockets = [];

class Socket extends EventEmitter {
  static OPEN = 1;
  readyState = Socket.OPEN;

  constructor(url) {
    super();
    this.url = url;
    sockets.push(this);
  }

  send(_data, callback) {
    callback();
  }

  terminate() {
    this.readyState = 3;
  }
}

class Controller {
  start() {}
  clearSleep() {}
  destroy() {}
}

class Accessory {}

// Keep the production Device and socket implementations; replace hardware and HomeKit collaborators.
mock.module('ws', { defaultExport: Socket });
mock.module(new URL('../dist/device/controller.js', import.meta.url).href, { namedExports: { DeviceController: Controller } });
mock.module(new URL('../dist/accessories/index.js', import.meta.url).href, {
  namedExports: { TelevisionAccessory: Accessory, SwitchAccessory: Accessory, FrameAccessory: Accessory },
});

const { Device } = await import('../dist/device/device.js');
const { AccessoryPoller } = await import('../dist/device/poller.js');
const { WebSocket } = await import('../dist/protocols/websocket.js');
const { FrameSocket } = await import('../dist/protocols/frame.js');

function createLogger(entries) {
  const log = () => {};
  for (const level of ['debug', 'info', 'warn', 'error', 'success']) {
    log[level] = (...args) => entries.push(args);
  }
  return log;
}

function assertNoTokens(entries) {
  const output = JSON.stringify(entries);
  assert.ok(!output.includes(TOKEN), 'TV token must not appear in any logger argument');
  assert.ok(!output.includes(CLIENT_TOKEN), 'Client token must not appear in any logger argument');
}

for (const cached of [false, true]) {
  test(`${cached ? 'cached' : 'fresh'} pairing keeps credentials and polling without logging the token`, async (t) => {
    const entries = [];
    const storage = { model: 'Test TV', ...(cached ? { token: TOKEN } : {}) };
    const sync = t.mock.method(AccessoryPoller.prototype, 'sync', () => {});
    const device = new Device(
      { name: 'Test TV', ip: '192.0.2.10', mac: '02:00:00:00:00:01' },
      { config: {}, log: createLogger(entries), storage: { get: () => storage }, api: { hap: { uuid: { generate: () => 'test-tv' } } } },
    );
    t.mock.method(device, 'syncAccessories', () => {});
    const socket = new WebSocket(device);
    t.after(() => {
      socket.destroy();
      device.destroy();
    });
    t.mock.method(socket, 'getInstalledApps', () => {});

    if (!cached) {
      device.power = true;
    }
    socket.start();
    if (!cached) {
      sockets.at(-1).emit('message', Buffer.from(JSON.stringify({ event: 'ms.channel.connect', data: { token: TOKEN } })));
      await socket.pairingPromise;
    }

    assert.equal(storage.token, TOKEN);
    assert.equal(sync.mock.callCount(), 1);
    assert.ok(entries.some((args) => args.some((arg) => typeof arg === 'string' && arg.includes('Device paired with success'))));
    assertNoTokens(entries);
  });
}

function createFrame(t) {
  const entries = [];
  const device = new EventEmitter();
  Object.assign(device, { config: { ip: '192.0.2.10' }, storage: { token: TOKEN, frameSupport: true }, power: false, log: createLogger(entries) });
  const frame = new FrameSocket(device);
  t.after(() => frame.destroy());
  return { entries, device, frame };
}

for (const encoded of [false, true]) {
  test(`Frame handshake omits tokens from ${encoded ? 'JSON-encoded' : 'object'} data and preserves the connection`, async (t) => {
    const { frame, entries } = createFrame(t);
    const data = { id: 'test-connection', token: TOKEN, clients: [{ attributes: { token: CLIENT_TOKEN } }] };
    const response = { event: 'ms.channel.connect', data: encoded ? JSON.stringify(data) : data };
    const original = JSON.stringify(response);
    const connection = frame.connect();
    const socket = sockets.at(-1);
    socket.emit('message', Buffer.from(original));
    await connection;

    assert.equal(frame.ws, socket);
    assert.equal(new URL(socket.url).searchParams.get('token'), TOKEN);
    if (!encoded) {
      assert.equal(frame.id, data.id);
    }
    assert.equal(JSON.stringify(response), original);
    assert.ok(JSON.stringify(entries).includes('ms.channel.connect'));
    assertNoTokens(entries);
  });
}

test('Frame art-state diagnostics omit arbitrary fields and preserve state events', async (t) => {
  const { frame, device, entries } = createFrame(t);
  const artEvents = [];
  const powerEvents = [];
  device.on('frame:artmode', (value) => artEvents.push(value));
  device.on('frame:power', (value) => powerEvents.push(value));
  const connection = frame.connect();
  const socket = sockets.at(-1);
  socket.emit('message', Buffer.from(JSON.stringify({ event: 'ms.channel.ready', data: { id: 'test-connection' } })));
  await connection;

  for (const payload of [
    { event: 'get_artmode_status', value: 'on', token: TOKEN },
    { event: 'art_mode_changed', status: 'off', nested: { token: CLIENT_TOKEN } },
    { event: 'go_to_standby', token: TOKEN },
    { event: 'wakeup', token: TOKEN },
  ]) {
    socket.emit('message', Buffer.from(JSON.stringify({ event: 'd2d_service_message', data: JSON.stringify(payload) })));
  }

  assert.deepEqual(artEvents, [true, false]);
  assert.deepEqual(powerEvents, ['standby', 'wakeup']);
  const output = JSON.stringify(entries);
  assert.ok(output.includes('get_artmode_status') && output.includes('on'));
  assert.ok(output.includes('art_mode_changed') && output.includes('off'));
  assertNoTokens(entries);
});

test('Frame diagnostics omit unrecognized state values without mutating the response', (t) => {
  const { frame, entries } = createFrame(t);
  const response = { event: 'd2d_service_message', data: JSON.stringify({ event: 'get_artmode_status', value: TOKEN, status: CLIENT_TOKEN }) };
  const original = JSON.stringify(response);
  frame.handleDebug(response);

  assert.equal(JSON.stringify(response), original);
  assert.ok(JSON.stringify(entries).includes('get_artmode_status'));
  assertNoTokens(entries);
});
