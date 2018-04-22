**NOTE: This plugin works only with Samsung TV's that have Tizen Operating System.**
***
# homebridge-samsung-tv
This is a plugin for [homebridge](https://github.com/nfarina/homebridge). It allows you to control your Samsung TV with HomeKit and Siri.

I have created this plugin because the existing ones are usign old/depreciate dependencies having problems with some of the key functions.

This plugins resolve some of the most important problems:
- Updating right away the status of the TV in HomeKit
- Waiting for commands to send before updating the state
- Keep the socket with TV open for faster communication
- Option to turn ON and OFF the TV right after the switch was toggled

## Installation
1. Install HomeBridge, please follow it's [README](https://github.com/nfarina/homebridge/blob/master/README.md).
2. Install this plugin using: `npm install -g --unsafe-perm homebridge-samsung-tv`
3. Update your configuration file. See below for a sample.

## Configuration
- Edit your configuration file from `~/.homebridge/config.json`
- Platform should always be **SamsungTV** then on the devices you can add your Samsung TV's.
- The **IP address** and **MAC address** are required in order to send the commands and wake the TV with **WOL** (Wake on lan) protocol..

```
"platforms": [ {
        "platform": "SamsungTV",
        "devices": [{
            "name": "Bedroom TV",
            "ip": "10.20.30.40",
            "mac": "A0:B1:C2:D3:E4:F5"
        }]
}]
```

By default the ON / OFF switch will be created for the TV. If you want you can also add new custom switches.

```
"platforms": [ {
        "platform": "SamsungTV",
        "devices": [{
            "name": "Bedroom TV",
            "ip": "10.20.30.40",
            "mac": "A0:B1:C2:D3:E4:F5"
            "switches": [
                {"name": "Mute", "type": "mute"},
                {"name": "Sleep", "type": "sleep", "time": 30},
                {"name": "Command", "type": "command", "command": "KEY_VOLUP"},
                {"name": "Command", "type": "command", "command": ["KEY_VOLUP", "KEY_VOLDOWN"]},
                {"name": "Channel", "type": "channel", "channel": 12}
            ]
        }]
}]
```

## Device settings
**All these settings are required**

| Name | Description |
| :------------ | :------------ |
| name | Name of the device in HomeKit |
| ip | The IP address of the device. I recommend setting a static IP for the device on your router settings |
| mac | The MAC address of the device. This is required to turn the TV ON |
| delay | This is the delay between commands and is `optional`. By default it is `400 ms` |

## Switch settings

| Name | Description |
| :------------ | :------------ |
| name | Name of the switch in HomeKit. The device name will be prepended |
| type | Type of the switch. It can be `sleep`, `channel` or `command` |
| time | This is **required** only if `type` is **sleep**. The time is in minutes |
| channel | This is **required** only if `type` is **channel** |
| command | This is **required** only if `type` is **command** and can be **string** or **array** |

## Important Notes
- The Tizen API will not work if the TV is powered down. In order to turn the TV on we send a WOL (Wake on lan) command to the **MAC address**. That's why the **IP address** and **MAC address** are **required**.

- Unfortunately the Tizen API will not offer information about the TV, like the current channel, volume or if the TV is on mute or not. That's why the custom switches are stateless switches (except sleep). This means the switch will always be OFF.

- The custom switches that are sending a list of commands will have a delay between them. By default the delay is set to 400 ms but it can be changed in the config file. Setting it to a lower value may result in not sending some of the commands.

- When you are turning ON or OFF the TV there is a delay of three seconds until you can send another command. That's why if you will try to toggle the switch right away after you already did, it will come back to the previous state and in the console you will get a message that the TV is in powering ON/OFF process.

## Commands List
```
KEY_MENU
KEY_UP
KEY_DOWN
KEY_LEFT
KEY_RIGHT
KEY_3
KEY_VOLUP
KEY_4
KEY_5
KEY_6
KEY_VOLDOWN
KEY_7
KEY_8
KEY_9
KEY_MUTE
KEY_CHDOWN
KEY_0
KEY_CHUP
KEY_PRECH
KEY_GREEN
KEY_YELLOW
KEY_CYAN
KEY_ADDDEL
KEY_SOURCE
KEY_INFO
KEY_PIP_ONOFF
KEY_PIP_SWAP
KEY_PLUS100
KEY_CAPTION
KEY_PMODE
KEY_TTX_MIX
KEY_TV
KEY_PICTURE_SIZE
KEY_AD
KEY_PIP_SIZE
KEY_MAGIC_CHANNEL
KEY_PIP_SCAN
KEY_PIP_CHUP
KEY_PIP_CHDOWN
KEY_DEVICE_CONNECT
KEY_HELP
KEY_ANTENA
KEY_CONVERGENCE
KEY_11
KEY_12
KEY_AUTO_PROGRAM
KEY_FACTORY
KEY_3SPEED
KEY_RSURF
KEY_ASPECT
KEY_TOPMENU
KEY_GAME
KEY_QUICK_REPLAY
KEY_STILL_PICTURE
KEY_DTV
KEY_FAVCH
KEY_REWIND
KEY_STOP
KEY_PLAY
KEY_FF
KEY_REC
KEY_PAUSE
KEY_TOOLS
KEY_INSTANT_REPLAY
KEY_LINK
KEY_FF_
KEY_GUIDE
KEY_REWIND_
KEY_ANGLE
KEY_RESERVED1
KEY_ZOOM1
KEY_PROGRAM
KEY_BOOKMARK
KEY_DISC_MENU
KEY_PRINT
KEY_RETURN
KEY_SUB_TITLE
KEY_CLEAR
KEY_VCHIP
KEY_REPEAT
KEY_DOOR
KEY_OPEN
KEY_WHEEL_LEFT
KEY_POWER
KEY_SLEEP
KEY_2
KEY_DMA
KEY_TURBO
KEY_1
KEY_FM_RADIO
KEY_DVR_MENU
KEY_MTS
KEY_PCMODE
KEY_TTX_SUBFACE
KEY_CH_LIST
KEY_RED
KEY_DNIe
KEY_SRS
KEY_CONVERT_AUDIO_MAINSUB
KEY_MDC
KEY_SEFFECT
KEY_DVR
KEY_DTV_SIGNAL
KEY_LIVE
KEY_PERPECT_FOCUS
KEY_HOME
KEY_ESAVING
KEY_WHEEL_RIGHT
KEY_CONTENTS
KEY_VCR_MODE
KEY_CATV_MODE
KEY_DSS_MODE
KEY_TV_MODE
KEY_DVD_MODE
KEY_STB_MODE
KEY_CALLER_ID
KEY_SCALE
KEY_ZOOM_MOVE
KEY_CLOCK_DISPLAY
KEY_AV1
KEY_SVIDEO1
KEY_COMPONENT1
KEY_SETUP_CLOCK_TIMER
KEY_COMPONENT2
KEY_MAGIC_BRIGHT
KEY_DVI
KEY_HDMI
KEY_W_LINK
KEY_DTV_LINK
KEY_APP_LIST
KEY_BACK_MHP
KEY_ALT_MHP
KEY_DNSe
KEY_RSS
KEY_ENTERTAINMENT
KEY_ID_INPUT
KEY_ID_SETUP
KEY_ANYNET
KEY_POWEROFF
KEY_POWERON
KEY_ANYVIEW
KEY_MS
KEY_MORE
KEY_PANNEL_POWER
KEY_PANNEL_CHUP
KEY_PANNEL_CHDOWN
KEY_PANNEL_VOLUP
KEY_PANNEL_VOLDOW
KEY_PANNEL_ENTER
KEY_PANNEL_MENU
KEY_PANNEL_SOURCE
KEY_AV2
KEY_AV3
KEY_SVIDEO2
KEY_SVIDEO3
KEY_ZOOM2
KEY_PANORAMA
KEY_4_3
KEY_16_9
KEY_DYNAMIC
KEY_STANDARD
KEY_MOVIE1
KEY_CUSTOM
KEY_AUTO_ARC_RESET
KEY_AUTO_ARC_LNA_ON
KEY_AUTO_ARC_LNA_OFF
KEY_AUTO_ARC_ANYNET_MODE_OK
KEY_AUTO_ARC_ANYNET_AUTO_START
KEY_AUTO_FORMAT
KEY_DNET
KEY_HDMI1
KEY_AUTO_ARC_CAPTION_ON
KEY_AUTO_ARC_CAPTION_OFF
KEY_AUTO_ARC_PIP_DOUBLE
KEY_AUTO_ARC_PIP_LARGE
KEY_AUTO_ARC_PIP_SMALL
KEY_AUTO_ARC_PIP_WIDE
KEY_AUTO_ARC_PIP_LEFT_TOP
KEY_AUTO_ARC_PIP_RIGHT_TOP
KEY_AUTO_ARC_PIP_LEFT_BOTTOM
KEY_AUTO_ARC_PIP_RIGHT_BOTTOM
KEY_AUTO_ARC_PIP_CH_CHANGE
KEY_AUTO_ARC_AUTOCOLOR_SUCCESS
KEY_AUTO_ARC_AUTOCOLOR_FAIL
KEY_AUTO_ARC_C_FORCE_AGING
KEY_AUTO_ARC_USBJACK_INSPECT
KEY_AUTO_ARC_JACK_IDENT
KEY_NINE_SEPERATE
KEY_ZOOM_IN
KEY_ZOOM_OUT
KEY_MIC
KEY_HDMI2
KEY_HDMI3
KEY_AUTO_ARC_CAPTION_KOR
KEY_AUTO_ARC_CAPTION_ENG
KEY_AUTO_ARC_PIP_SOURCE_CHANGE
KEY_HDMI4
KEY_AUTO_ARC_ANTENNA_AIR
KEY_AUTO_ARC_ANTENNA_CABLE
KEY_AUTO_ARC_ANTENNA_SATELLITE
KEY_EXT1
KEY_EXT2
KEY_EXT3
KEY_EXT4
KEY_EXT5
KEY_EXT6
KEY_EXT7
KEY_EXT8
KEY_EXT9
KEY_EXT10
KEY_EXT11
KEY_EXT12
KEY_EXT13
KEY_EXT14
KEY_EXT15
KEY_EXT16
KEY_EXT17
KEY_EXT18
KEY_EXT19
KEY_EXT20
KEY_EXT21
KEY_EXT22
KEY_EXT23
KEY_EXT24
KEY_EXT25
KEY_EXT26
KEY_EXT27
KEY_EXT28
KEY_EXT29
KEY_EXT30
KEY_EXT31
KEY_EXT32
KEY_EXT33
KEY_EXT34
KEY_EXT35
KEY_EXT36
KEY_EXT37
KEY_EXT38
KEY_EXT39
KEY_EXT40
KEY_EXT41
```