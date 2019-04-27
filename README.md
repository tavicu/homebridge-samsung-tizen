**NOTE: This plugin works only with Samsung TV's that have Tizen Operating System.**
**v3 of the plugin is compatible only with iOS 12.2+**

**I know the documentation is not very detailed but soon i want to make the Wiki section with information regarding everything**

***
# homebridge-samsung-tizen
This is a plugin for [homebridge](https://github.com/nfarina/homebridge). It allows you to control your Samsung TV with HomeKit and Siri.

I have created this plugin because the existing ones are usign old/depreciate dependencies having problems with some of the key functions.

This plugins resolve some of the most important problems:
- Updating right away the status of the TV in HomeKit
- Waiting for commands to send before updating the state
- Keep the socket with TV open for faster communication
- Option to turn ON and OFF the TV right after the switch was toggled
- Update switch status in real time (optional)

**I don't need donations, but a Star will motivate me ;)**

## Installation
- Install HomeBridge, please follow it's [README](https://github.com/nfarina/homebridge/blob/master/README.md)
- On TV go to `Settings` - `General` - `External Device Manager` - `Device Connection Manager` and set `Access Notification` to **`Off`**
- Install this plugin using: `sudo npm install -g --unsafe-perm homebridge-samsung-tizen`
- Update your configuration file. See below for a sample.
- Make sure your TV is ON and run the HomeBridge server
- On the TV you will have a popup that will ask your permission. Click `Allow`


## Configuration
- Edit your configuration file from `~/.homebridge/config.json`
- Platform should always be **SamsungTizen** then on the devices you can add your Samsung TV's
- The **IP address** and **MAC address** are required in order to send the commands and wake the TV with **WoL** (Wake on LAN) protocol

```
"platforms": [{
    "platform": "SamsungTizen",
    "devices": [{
        "name": "Bedroom TV",
        "ip": "10.20.30.40",
        "mac": "A0:B1:C2:D3:E4:F5"
    }]
}]
```

### Since iOS 12.2 you can add custom inputs for TV

```
"platforms": [{
    "platform": "SamsungTizen",
    "inputs": [
        {"name": "Live TV", "type": "command", "value": ["KEY_SOURCE", "KEY_LEFT*3", "KEY_ENTER"]},
        {"name": "Netflix", "type": "app", "value": "11101200001"}
    ],
    "devices": [{
        "name": "Bedroom TV",
        "ip": "10.20.30.40",
        "mac": "A0:B1:C2:D3:E4:F5"
    }]
}]
```

### By default only the ON / OFF switch will be created for the TV. You do have the option to create more custom switches with different actions.
Adding custom switches will not remove the default one (ON/OFF)

```
"platforms": [{
    "platform": "SamsungTizen",
    "devices": [{
        "name": "Bedroom TV",
        "ip": "10.20.30.40",
        "mac": "A0:B1:C2:D3:E4:F5",
        "switches": [
            {"name": "Mute",      "mute": true},
            {"name": "Sleep",     "sleep": 60},
            {"name": "Channel",   "channel": 13},
            {"name": "Command 1", "command": "KEY_VOLUP"},
            {"name": "Command 2", "command": "KEY_VOLUP*5"},
            {"name": "Command 3", "command": ["KEY_VOLUP", "KEY_VOLDOWN"]},
            {"name": "Command 4", "command": ["KEY_VOLUP*5", "KEY_VOLDOWN*3"]},
            {"name": "All", "sleep": 60, "mute": true, "command": ["KEY_VOLUP", "KEY_VOLDOWN"], "channel": 13}
        ]
    }]
}]
```

## Device settings
All settings (except delay) are required

| Name | Description |
| :------------ | :------------ |
| name | Name of the device in HomeKit |
| ip | The IP address of the device. I recommend setting a static IP for the device on your router settings |
| mac | The MAC address of the device. This is required to turn the TV ON |
| delay | This is the delay between commands and is `optional`. By default it is `400 ms` |

## Switch settings

| Name | Description |
| :------------ | :------------ |
| name | Name of the switch in HomeKit. The device name will be appended |
| power | A switch will not work if the TV is OFF. Setting this option to true it will turn the TV ON first then run the commands |
| app | This option will open the selected application. You must instet the application id which you will find it below |
| sleep | This option will turn the TV OFF after a specific time. Value is in **minutes** |
| mute | This option will send the mute command to TV |
| channel | The channel number to switch the TV |
| command | Send a command(s) to TV. This option can be **string** or **array**. You can use `*` for sending repetitive commands. For example `KEY_VOLUP*5` |

### Switch when TV is OFF
By default a switch will throw an error if the TV is OFF. If you add the `power` parameter, first we check if the TV is OFF and turn it ON.
Then will send the command with a **delay** of `1500 ms`.
```
{"name": "Command 1", "power": true, "command": "KEY_VOLUP"}
```

### Open application
```
{"name": "Netflix", "app": "11101200001"}
```

### A switch can take all commands
This for example will:
- Set a sleep time for 60 minutes, Mute the TV, Change the aspect ratio to 16:9 and Switch the TV to channel 13
```
{"name": "All", "sleep": 60, "mute": true, "command": "KEY_16_9", "channel": 13}
```

### Example of repetitive commands
Send `KEY_VOLUP` **five** times
```
{"name": "5 Up", "command": "KEY_VOLUP*5"}
```
Send `KEY_VOLUP` **five** times then `KEY_VOLDOWN` **three** times
```
{"name": "5 Up 3 Down", "command": ["KEY_VOLUP*5", "KEY_VOLDOWN*3"]}
```

### Example of hold commands
Hold `KEY_VOLUP` for **2 seconds**
```
{"name": "Volup", "command": "KEY_VOLUP*2s"}
```
You can also use float numbers. For half second for example you can use:
```
{"name": "Volup", "command": "KEY_VOLUP*0.5s"}
```

## Common Issues

### TV is turning ON but no other command works
Check if you tv TV is compatible with the plugin. Turning ON the TV is working because is using a general protocol that works on most of the devices.

### HomeBridge is crashing because of the plugin
The server is crashing at load with the folowing error `SyntaxError: Unexpected token ...`
Update your **Node** to a newer version.

### TV is not showing the pair popup
- Make sure your TV is compatible with the plugin.

- On TV go to `Settings` - `General` - `External Device Manager` - `Device Connection Manager` - `Device List` and make sure you didn't select `Deny`.

- Try to hard reset your TV. To do this turn ON the TV then press on power key from the remote for 3 seconds until TV restarts and show Samsung logo.

### TV is always asking for permissions
On TV go to `Settings` - `General` - `External Device Manager` - `Device Connection Manager` and set `Access Notification` to `Off`.

### Check if TV is compatible with the plugin
In order to check access the folowing url `http://TV_IP:8001/api/v2/` (replace TV_IP with your TV IP).
The page should return informations regarding your TV.
If the endpoint is not working then your TV is not compatible with the plugin.

Please understand that some TV's are not compatible even if the endpoint is working. Some use a different type of pairing (with PIN) that it's not supported at the momennt.

You can read more on [Samsung Developers page](https://developer.samsung.com/tv/develop/extension-libraries/smart-view-sdk/receiver-apps/debugging).

### Other
If you have other problem run HomeBridge with debug mode `DEBUG=* homebridge -D` and [open a new Issue](https://github.com/tavicu/homebridge-samsung-tizen/issues/new) and we will try to figure it out together :)

Issues that are opened without logs from debug mode will have less priority because it means that you didn't read this documentation for which I have worked hard :P

## Important Notes
- The Tizen API will not work if the TV is powered down. In order to turn the TV on we send a WoL (Wake on LAN) command to the **MAC address**. That's why the **IP address** and **MAC address** are **required**.

- Unfortunately the Tizen API will not offer information about the TV, like the current channel, volume or if the TV is on mute or not. That's why the custom switches are stateless switches (except sleep). *This means the switch will always be OFF*.

- The custom switches that are sending a list of commands will have a delay between them. By default the delay is set to `400 ms` but it can be changed in the config file. *Setting it to a lower value may result in not sending some of the commands*.

- When you are turning the TV ON or OFF there is a delay of three seconds until you can send another command. That's why if you will try to toggle the switch right away after you already did, it will come back to the previous state and in the console you will get a message that the TV is in powering ON/OFF process.

- Sometimes Inputs are not appearing right away in the Home app.

***

## Applications
Below you can find a table with most common apps. If you don't find what you are looking for you can start the homebridge server with tizen-apps as parameter (`homebridge tizen-apps`) and it will show a table with all the apps that are installed on the TV.

Please make sure your TV is ON and paired.

| Application | ID |
| :------------ | :------------ |
| YouTube | 111299001912 |
| Netflix | 11101200001 |
| HBO GO | 3201706012478 |
| Internet | org.tizen.browser |
| Steam Link | 3201702011851 |
| Prime Video | 3201512006785 |

## Commands List
```
KEY_ENTER
KEY_MENU
KEY_UP
KEY_DOWN
KEY_LEFT
KEY_RIGHT
KEY_0
KEY_1
KEY_2
KEY_3
KEY_4
KEY_5
KEY_6
KEY_7
KEY_8
KEY_9
KEY_11
KEY_12
KEY_VOLUP
KEY_VOLDOWN
KEY_MUTE
KEY_CHDOWN
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
KEY_DMA
KEY_TURBO
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
KEY_AV2
KEY_AV3
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
KEY_AUTO_ARC_CAPTION_KOR
KEY_AUTO_ARC_CAPTION_ENG
KEY_AUTO_ARC_PIP_SOURCE_CHANGE
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
