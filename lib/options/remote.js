const DEFAULTS = {
    REWIND         : 'KEY_REWIND',
    FAST_FORWARD   : 'KEY_FF',
    NEXT_TRACK     : '',
    PREVIOUS_TRACK : '',
    ARROW_UP       : 'KEY_UP',
    ARROW_DOWN     : 'KEY_DOWN',
    ARROW_LEFT     : 'KEY_LEFT',
    ARROW_RIGHT    : 'KEY_RIGHT',
    SELECT         : 'KEY_ENTER',
    BACK           : 'KEY_RETURN',
    EXIT           : 'KEY_HOME',
    PLAY_PAUSE     : 'KEY_PLAY_BACK',
    INFORMATION    : 'KEY_INFO'
};

module.exports = function(accessory) {
    let keys   = DEFAULTS;
    let output = {};

    for (let index in accessory.device.config.keys) {
        let key   = index.toString().toUpperCase();
        let value = accessory.device.config.keys[index];

        if (accessory.hap.Characteristic.RemoteKey[key] !== undefined) {
            keys[key] = value;
        }
    }

    for (let key in keys) {
        output[accessory.hap.Characteristic.RemoteKey[key]] = keys[key];
    }

    return output;
}