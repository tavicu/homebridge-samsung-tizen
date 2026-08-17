/**
 * Power-state decoding in Base#getStateHttp.
 *
 * Run: node --test
 *
 * The case that matters is the empty string. 2024+ Tizen firmware reports
 * "on" when the panel is on and "" in standby -- it never sends "standby" --
 * and these sets keep port 8001 answering while asleep, so the port check
 * can't catch it either. Upstream tested the value's truthiness, so standby
 * fell through to the assume-on branch and the HomeKit tile stuck On forever.
 */
const test   = require('node:test');
const assert = require('node:assert');
const Base   = require('../lib/methods/base');

function methodReporting(info) {
    const device = {
        config  : { ip: '127.0.0.1', mac: '00:00:00:00:00:00', name: 'Test TV' },
        cache   : {},
        storage : {},
        emit    : () => true,
        on      : () => {},
        log     : { debug() {}, info() {}, warn() {}, error() {} }
    };

    const method = new Base(device);

    method.getInfo = () => Promise.resolve(info);

    return method;
}

test('PowerState "on" reads as on', async () => {
    assert.equal(await methodReporting({ device: { PowerState: 'on' } }).getStateHttp(true), true);
});

test('empty PowerState is standby, not unknown', async () => {
    assert.equal(await methodReporting({ device: { PowerState: '' } }).getStateHttp(true), false);
});

test('PowerState "standby" reads as off', async () => {
    assert.equal(await methodReporting({ device: { PowerState: 'standby' } }).getStateHttp(true), false);
});

test('a TV that omits PowerState still trusts the port check', async () => {
    assert.equal(await methodReporting({ device: {} }).getStateHttp(true), true);
    assert.equal(await methodReporting({ device: {} }).getStateHttp(false), true);
});

test('an unreachable TV uses the fallback', async () => {
    const method = methodReporting(null);

    method.getInfo = () => Promise.reject(new Error('timeout'));

    assert.equal(await method.getStateHttp(false), false);
    assert.equal(await method.getStateHttp(true), true);
});
