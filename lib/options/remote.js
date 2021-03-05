const DEFAULTS = {
    ARROW_UP       : 'KEY_UP',
    ARROW_DOWN     : 'KEY_DOWN',
    ARROW_LEFT     : 'KEY_LEFT',
    ARROW_RIGHT    : 'KEY_RIGHT',
    SELECT         : 'KEY_ENTER',
    BACK           : 'KEY_RETURN',
    PLAY_PAUSE     : 'KEY_PLAY_BACK',
    INFORMATION    : 'KEY_INFO'
};

module.exports = function(Device, Hap) {
    let keys   = DEFAULTS;
    let output = {};

    for (let index in Device.config.keys) {
        let key   = index.toString().toUpperCase();
        let value = Device.config.keys[index];

        if (Hap.Characteristic.RemoteKey[key] !== undefined) {
            keys[key] = value;
        }
    }

    for (let key in keys) {
        output[Hap.Characteristic.RemoteKey[key]] = keys[key];
    }

    return output;
}