module.exports = function(hap) {
    return {
        [hap.Characteristic.RemoteKey.REWIND]:         'KEY_REWIND',
        [hap.Characteristic.RemoteKey.FAST_FORWARD]:   'KEY_FF',
        [hap.Characteristic.RemoteKey.ARROW_UP]:       'KEY_UP',
        [hap.Characteristic.RemoteKey.ARROW_RIGHT]:    'KEY_RIGHT',
        [hap.Characteristic.RemoteKey.ARROW_DOWN]:     'KEY_DOWN',
        [hap.Characteristic.RemoteKey.ARROW_LEFT]:     'KEY_LEFT',
        [hap.Characteristic.RemoteKey.SELECT]:         'KEY_ENTER',
        [hap.Characteristic.RemoteKey.PLAY_PAUSE]:     'KEY_PLAY',
        [hap.Characteristic.RemoteKey.BACK]:           'KEY_RETURN',
        [hap.Characteristic.RemoteKey.EXIT]:           'KEY_HOME',
        [hap.Characteristic.RemoteKey.INFORMATION]:    'KEY_TOOLS'
    }
}