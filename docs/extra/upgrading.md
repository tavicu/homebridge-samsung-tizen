# Upgrading from version 5

Version 6 keeps the TVs you already added in the Home app. You do not add them again, and you do not remove the bridge.

A few settings changed. SmartThings has to be authorized again. Inputs and custom switches may need their names or scenes set once more in Home, because HomeKit now identifies them by what they do, not by their position in the list.

## What you need to change

- **SmartThings.** The personal access token (`api_key`) is gone. Create a SmartThings app and connect it from the settings screen. See [SmartThings](/configuration/smartthings-api.md).
- **Device ID.** `device_id` still works. The current name is `deviceId`.
- **Digital TV.** The SmartThings id is `dtv`. If an input or switch still says `digitalTv`, open it in the settings screen and save it again as Digital TV. Until you do, Home will not show it as the active source.
- **Art Mode input.** The type is `artmode`. An older `type: art` does nothing until you change it. See [Frame TVs](/configuration/frame-tvs.md#art-mode-input).
- **Picture mode.** Switches store the SmartThings mode id (`modeMovie`, and so on). Existing English names `Dynamic`, `Standard`, `Natural`, and `Movie` keep working and are mapped to those ids.

## Settings that are ignored

These keys are skipped if they are still in the config:

- `api_key`, replaced by the SmartThings authorization above
- `refresh`, power, volume, and mute are no longer polled on a timer you can set
- `delay`, `timeout`, and `wait_time`, timings are internal
- `method` and `port`, the connection to the TV is detected automatically

## Inputs and switches in Home

Reordering the list only changes the order in Home. Renaming a switch does not create a new accessory. Changing what an input or switch does (the app, the source, the commands) is what Home treats as a different item, so a scene that pointed at the old one may need to be pointed again.

An input or switch with no name is skipped and written to the log. It no longer stops the whole TV from loading.

Plugin-level `inputs`, `switches`, and `keys` apply to every TV. A list set on a device is the one that TV uses. See [Device settings](/configuration/device-settings.md).
