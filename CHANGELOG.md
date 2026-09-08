# Change Log

## 6.0.0

This is a full rewrite of the plugin in TypeScript. It is backwards compatible: your existing TVs stay in Home, you don't have to add them again. A few settings changed, SmartThings has to be authorized again, and inputs or custom switches may need their Home names and scenes set up once more.

**Not available yet**

- Support for Frame TVs is not implemented in this version and it will come back in a later release.

**Requirements**

- Node.js 22.10+, 24, or 26
- Homebridge 1.8 or newer (Homebridge 2.0 is recommended)
- Homebridge Config UI X v5.27.0 or newer, for the interactive configuration interface

**New**

- The plugin is now written in TypeScript and shipped as an ES module.
- Brand new interactive configuration interface for Config UI X.
- When SmartThings is connected, the configuration interface loads your TVs from SmartThings so you can pick the Device ID, and loads that TV's picture modes for custom switches.
- The state of the TV is now updated in real time through SSDP announcements. If those announcements never arrive or stop without a goodbye, the plugin falls back to checking whether the TV is reachable.
- Volume and mute are read in real time from the TV through DMR (UPnP) events, so the values in Home app follow the physical remote.
- Absolute volume control is now available without SmartThings.
- The speaker now reports the same on/off state as the TV, so the volume buttons in the iOS Remote widget stay enabled when the TV is on.
- New option to disable a device from the plugin without removing it from the configuration.
- Only TVs that support token authentication are officially supported. If a TV does not, a warning is written to the log at startup, and the configuration interface reports this when you test the connection.
- `keys`, `inputs`, `switches` and `wol` can now be configured once at plugin level and are inherited by every device. Anything set on a device still wins.
- Remote `keys` now map every iOS Remote button Home shows for a TV.
- All dependencies were updated to their latest versions.

**Improved**

- Storage backups: When you change plugin storage from the configuration interface, `samsung-tizen.json` is backed up first to `backups/samsung-tizen/`, keeping the last 10 backups. Saves made by the plugin itself (pairing tokens, cached device info) do not create a backup.

**Changed**

- When Home asks which input is active, the plugin now prioritizes inputs so it makes as few requests to the TV as possible to determine the active input.
- A custom switch that has more than one option with a state, for example `sleep` together with `mute`, now shows as ON when any of those options is active. Before, all of them had to be active at the same time.
- Custom switches that launch an app, select an input source or set a picture mode now stay ON in Home while that app, source or picture mode is active on the TV. They are checked automatically while the TV is on. Command, volume and channel switches still behave as momentary and turn off after a short delay.
- Using a switch while the TV is off, when that switch is not set to turn the TV on, no longer looks like a failure in Home. The switch turns back off and a warning is written to the log.
- `device_id` was renamed to `deviceId`. The old name still works for now.
- Custom switches that set a picture mode now store the SmartThings mode id (e.g. `modeMovie`) instead of its English display name, so the correct value is sent regardless of the TV's language. Existing switches with the old English names (`Dynamic`, `Standard`, `Natural`, `Movie`) keep working automatically.
- Inputs and custom switches are identified in Home by what they do (source, app, commands, switch actions), not by their position in the config. Reordering the list only changes the order they appear in Home. Renaming a switch no longer creates a new accessory. An input or switch without a name is skipped and logged, instead of taking down the whole TV.

**Fixed**

- Turning the TV on or off when it is already in that state, or while it is still switching, no longer makes Home app show "No Response". The command is ignored instead.
- The power switch in Home app no longer jumps back to off right after you turn the TV on, while the TV is still starting.
- A TV that is unplugged, or loses power without sending a goodbye announcement, is no longer stuck on "on" forever.
- TVs that keep announcing themselves while in standby are reported as off, not on.
- Custom remote key mappings no longer leak between TVs. Each TV keeps its own `keys`.

**Interactive configuration interface**

The plugin now has its own interface in Config UI X. You add, edit and delete devices, inputs and switches from there, without touching the JSON config.

Before you add a TV, you can test the connection. If the connection is successful and the TV returns a MAC address, it is filled in automatically.

SmartThings is authorized from a step by step wizard in the same screen. Once it is connected, Device ID and picture modes are loaded from SmartThings as described above.

**SmartThings uses a new authorization flow**

SmartThings dropped support for the personal access tokens that never expire, so the `api_key` setting is gone. The plugin now uses the official OAuth flow: you create a SmartThings app once, fill in the client ID and client secret, and the plugin refreshes the access token on its own. 

There is a step by step wizard in the new configuration interface. Until you go through it, every feature that depends on SmartThings stays unavailable.

**Settings that are no longer used**

These were removed and are ignored if they are still present in your configuration:

- `refresh` - there is no configurable poll interval anymore. Power state arrives through SSDP, with a built-in fallback check when announcements are missing. Volume and mute arrive through DMR events. Switches that track an app, an input source or a picture mode are checked on a fixed internal interval, only while the TV is on.
- `delay`, `timeout` and `wait_time` - these timings are now handled internally.
- `method` and `port` - the connection to the TV is detected automatically.
- `api_key` - replaced by the SmartThings authorization flow described above.

## 5.2.6

- By default all custom switches have the main accessory name prepended. We have added the option to disable this. Read [the documentation](https://tavicu.github.io/homebridge-samsung-tizen/configuration/device-settings.html#options) to see how to do it.
- Updated the plugin to reflect our [new documentation](https://tavicu.github.io/homebridge-samsung-tizen/).

## 5.2.5

Fix custom switches label.

## 5.2.4

Bug fixing and improvements.

## 5.2.3

ATTENTION! This is just a bump in version so the message can reach more users.
Samsung pushed a new update for Frame TVs (late 2021 and 2022 from what we know)
and it decided to remove the API for Art Mode.
Right now we are still looking for a solution.
Until then, don't update your Frames and make sure you disable Auto Update.

## 5.2.0

- New: Add integration with SmartThings API
- Add option to create inputs that selects a specific source (require SmartThings API)
- Add option to select picture mode (require SmartThings API)
- Add option to set volume with a switch (require SmartThings API)
- If SmartThings API is configured use it for changing channels
- Add delay when running a command right after the TV powered ON
- Clear sleep timeout if the TV shuts down sooner
- Fix warning when a custom switch takes longer to execute
- Update dependencies used by the plugin
- Remove feature to list installed applications (Samsung removed their API)

Read here on how to setup SmartThings API: https://github.com/tavicu/homebridge-samsung-tizen/wiki/SmartThings-Setup

## 5.1.1

- Fix compatibility with HOOBS

For more informations regarding this problem please follow this link: https://github.com/hoobs-org/HOOBS/issues/1790#issuecomment-1038079128

## 5.1.0

- Update and improve http requests
- Improve listeners that update accessories
- Improve storage of settings that are fetched automatically
- Fix a bug that prevented the plugin to fetch the settings
- Add option in Config UI interface to select Type of TV
- Respond to power on/off actions in a maximum time of 1.5 seconds

## 5.0.0

- Add support for Frame TVs
- Add Power switch for Frame TVs
- Add Art Mode switch for Frame TVs
- Use events for initialise elements and status changes
- Refresh all accessories when state of TV changes

For more informations regarding Frame Support please follow this link: https://git.io/JOII1

## 4.4.1

- Fix bug that destroy storage because of multiple savings in the same time

## 4.4.0

- Cleanup unused Keys from config
- Accept multiple commands as string separated by comma
- Update config schema for Config Ui X settings interface
- If TV responds to ping, check the PowerState value if TV supports it
- Implement a caching method for requests so we don't stress the TVs
- Added error message when failing to fetch installed applications
- Stylized the response for installed applications output
- Reinitialize remote after TV informations where fetched
- Remove sleeping mode when turning off the device if TV supports PowerState

## 4.3.7

- Use POST method to open applications

## 4.3.6

- Update Readme
- Add funding option for Config Ui X
- Replace deprecated package

## 4.3.4

- Add error message when TV is off and is trying to fetch installed apps
- Fix warning message from Homebridge 1.3.0

## 4.3.0

- Add support for WoL settings
- @mxdanger helped us with adding option to customize the settings from Config UI X interface!

## 4.2.1

- Fix open Apple TV application
- Add Mute Characteristic for volume
- Add a new method to display installed apps

## 4.2.0

- Bug fixing
- Group switches with the main accessory since from iOS 13.2 you have the option to show them separately.

## 4.1.0

- Bug fixing
- Compatible with iOS 13.

## 4.0.0

- Bug fixing
- New method for declaring accessories.

**IMPORTANT!** With this release the TVs will be declared as external accessories.
Updating from v3 to v4 will require you to add the TVs in Home app again.

This is required because HomeKit expects only one TV per bridge and now every TV will act as a bridge.

You can read how to add the TV in [Step 6 from Configuration page](https://github.com/tavicu/homebridge-samsung-tizen/wiki/Installation#6-adding-the-tv-to-home-app)

## 3.1.3

- Never fail custom switches for better working with automations

## 3.1.1

- Fix a bug that didn't display installed apps when running `tizen-apps`
- Improvements of how accessories are created

## 3.1.0

- Bug fixing
- Change default settings for `refresh` option
- Option to change remote keys mapping

## 3.0.0

- Use the new iOS 12.2 support for `Television` as accessory type
- Option to add inputs for TV with the new iOS 12.2 feature
- Control TV from Remote Control Center
- Save the token automaticaly on the server
- More options for `refresh` in real time
- Better logging in debug mode
- New method to check if TV is active
- Option to hold a command key for a time

## 2.1.0

- Option to open applications with a switch
- New support to update the switches with state in real time
