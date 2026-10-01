# Upgrading from version 5

Version 6 is a full rewrite of the plugin. It keeps the TVs you already added in the Home app. You do not add them again, and you do not remove them from Homebridge.

Most of your config keeps working as it is. SmartThings has to be authorized again, and a few settings have new names. Inputs and custom switches may need their names or scenes set once more in Home, because HomeKit now identifies them by what they do, not by their position in the list.

::: tip
Do not remove the TV from Home and add it again to fix a problem after the upgrade. It does not help, and you lose the room, names, scenes and automations of that TV.

If something does not work after the upgrade, check [common issues](/troubleshooting/common-issues.md) first. If the problem is not there, [open an issue](/troubleshooting/open-new-issue.md) with debug logs, so it can be fixed.
:::

## Before you upgrade

Version 6 needs:

- Node.js `22.10+`, `24`, or `26`
- Homebridge `1.8` or newer (Homebridge 2.0 recommended)
- Homebridge Config UI X `v5.27.0` or newer, for the settings screen

## What the log tells you

At startup the plugin checks your config for settings from version 5. For each one it finds, it writes a warning that says what to change, followed by a link to this page. For example:

```bash
[Bedroom TV] SmartThings no longer works with "api_key". Remove it from your config and connect SmartThings again from the plugin settings.
[Bedroom TV] Your config uses v5 values. They work for now, but will stop working in a future version. Please update your config: rename "device_id" to "deviceId"; input "Live TV": change value from "digitalTv" to "dtv".
[Bedroom TV] These v5 settings are no longer used and can be removed from your config: refresh, timeout.
How to upgrade your config from v5: https://tavicu.github.io/homebridge-samsung-tizen/extra/upgrading.html
```

The plugin never changes `config.json` itself. Old values are converted while Homebridge runs, and the warnings stay until you update the config.

## What you need to change

### SmartThings

The personal access token (`api_key`) is no longer accepted. SmartThings now uses an OAuth app that you create once. Until you go through the new setup, the features that need SmartThings do not work. See [SmartThings integration](/smartthings/index.md).

### Old values that still work for now

These work in version 6, but will stop working in a future version. Change them in `config.json`, or from the `Config` tab in Homebridge UI. For an input or a switch, you can also open it in the settings screen, choose **Art Mode** or **Digital TV** again and save it.

| Version 5            | Version 6        | Where                                                                    |
| :------------------- | :--------------- | :----------------------------------------------------------------------- |
| `device_id`          | `deviceId`       | Device. See [deviceId](/configuration/device-settings.md#deviceid).      |
| `"type": "art"`      | `"type": "artmode"` | Inputs. See [Frame TVs](/configuration/frame-tvs.md#art-mode-input). |
| `digitalTv`          | `dtv`            | Inputs and switches with a Digital TV source                             |

### Picture mode

Switches now store the SmartThings mode id, such as `modeMovie`, instead of the English name. The names `Dynamic`, `Standard`, `Natural` and `Movie` keep working and are sent as their ids. There is no warning for them. See [Picture mode](/smartthings/features.md#picture-mode).

## Settings that are no longer used

These keys are ignored if they are still in the config. You can remove them.

- `api_key`, replaced by the [SmartThings integration](/smartthings/index.md)
- `refresh`, the TV reports power, volume and mute on its own now, and switches are checked on a fixed interval while the TV is on
- `delay`, `timeout` and `wait_time`, these timings are handled internally
- `method` and `port`, the connection to the TV is detected automatically

## What changed in behavior

### Inputs and switches in Home

Home now identifies an input by its type and value, and a switch by its actions. Reordering the list only changes the order in Home. Renaming a switch does not create a new accessory. Changing what an input or switch does (the app, the source, the commands) makes it a new item, so a scene that used the old one has to be set again.

After the upgrade, Home may see your existing inputs and switches as new ones once. Set their names and scenes again if needed.

An input or switch with no name is skipped and written to the log. It no longer stops the whole TV from loading.

### Switches

- A switch with more than one action that has a state is ON when **any** of them matches the TV. Before, all of them had to match.
- Switches that open an app, select a source, set a picture or sound mode, or change the channel stay ON while that is active on the TV.
- `"mute": false` now unmutes the TV. In version 5 every mute switch sent `KEY_MUTE`.
- Using a switch while the TV is off, when the switch does not turn the TV on, no longer shows an error in Home. The switch turns back off and a warning is written to the log.

See [Switches](/features/switches.md).

### Volume

Volume and mute are read from the TV as soon as they change, and an exact volume level no longer needs SmartThings. See [Volume](/features/volume.md).
