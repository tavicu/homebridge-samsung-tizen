# Change Log

## 6.1.0

**New**

- **Automatic discovery.** When you add a device in the plugin settings, the plugin automatically searches your network for compatible Samsung devices and suggests the ones it finds above the form. Choose **Use** to fill in the device's name, IP and MAC address. Devices already in your config are left out, and devices that do not support token authentication are marked as not supported.

**Improved**

- The plugin no longer uses `peer-ssdp`, which had not been updated in 11 years, to follow the TV's power state. Its own SSDP listener picks up network interface changes, retries when port 1900 is busy, and writes each socket error to the log only once.

**Fixed**

- Some Frame TVs answer the Art Mode status request with a differently named event, which the plugin did not recognize. After Homebridge restarted, these TVs showed as on in Home while they were in Art Mode, until Art Mode was turned off and on again. The plugin now listens for both events.
- The SmartThings wizard no longer rejects authorization codes that contain an underscore or a hyphen.

## 6.0.0

Version 6 is a full rewrite of the plugin in TypeScript. It is backwards compatible: your existing TVs stay in Home, you don't have to add them again, and your current config keeps working as it is.

After the update:

- **SmartThings has to be authorized again.** The `api_key` setting no longer works. Until you go through the new wizard in the plugin settings, the features that depend on SmartThings stay unavailable.
- **Inputs and custom switches may need their Home names and scenes set up once more.** Home now identifies them by what they do, not by their position in the list.
- **A few settings were renamed or removed.** Nothing breaks if you leave them: the old names still work for now, the removed ones are ignored, and at startup the log tells you what to change.

See the [upgrade guide](https://tavicu.github.io/homebridge-samsung-tizen/extra/upgrading.html) for the steps.

**Requirements**

- Node.js 22.10+, 24, or 26. Node.js 20 is no longer supported.
- Homebridge 1.8 or newer (Homebridge 2.0 is recommended)
- Homebridge Config UI X v5.27.0 or newer, for the interactive configuration interface. Older versions show the basic editor instead.
- A TV that supports token authentication. Only these TVs are officially supported, and the `ws` connection method that v5 used for the others was removed. If a TV does not support it, a warning is written to the log at startup, and the configuration interface reports this when you test the connection.

**SmartThings uses a new authorization flow**

SmartThings dropped support for the personal access tokens that never expire, so the `api_key` setting is gone. The plugin now uses the official OAuth flow: you create a SmartThings app once, fill in the client ID and client secret, and the plugin refreshes the access token on its own.

There is a step by step wizard in the new configuration interface, and the [SmartThings guide](https://tavicu.github.io/homebridge-samsung-tizen/smartthings/) covers every step. Until you go through it, every feature that depends on SmartThings stays unavailable: input sources, picture modes, sound modes and the full power off of a Frame TV. Everything else, volume included, works on your local network without it.

**Frame TVs**

Support for The Frame is back: the plugin detects a Frame automatically and controls Art Mode on the local network.

Samsung does not allow turning a Frame fully off through the local API. When SmartThings is connected and the TV has a Device ID, turning the Frame TV off uses SmartThings instead.

- By default the TV tile follows Art Mode: ON means you are watching TV, OFF means Art Mode is active. Turning the tile off switches Art Mode on. It does not cut power. Turning the tile on switches Art Mode off. If the TV is fully off, it is turned on first.
- Enable `Frame.RealPowerMode` on the device if you want the tile to turn the Frame fully on and off. ON means the TV has power, including while Art Mode is on. OFF cuts power. This needs SmartThings (authorization and a Device ID). Without SmartThings the plugin falls back to a long press of the power key, which newer Frame TVs no longer honor, so a full power off may not work.
- You can add an Art Mode input if you want to switch Art Mode on from the TV's input list. In Home it shows as the active input while Art Mode is on, and it is updated as soon as Art Mode changes on the TV. The input type is now `artmode`. An input with `type: art` from an older config still works for now, but change it to `artmode`.
- Frame TVs also get two switches on the TV accessory, same as before: Art Mode and Power. Art Mode turns Art Mode on and off. Power turns the TV fully on and off, including while Art Mode is on. Hide either one with `Frame.ArtSwitch.Disable` or `Frame.PowerSwitch.Disable`.
- Art Mode stays in sync from the TV's own events. While the TV is on, the plugin also checks Art Mode on the same interval it uses for switches, and it skips Frame requests while the TV is off.

**Interactive configuration interface**

The plugin now has its own interface in Config UI X. You add, edit and delete devices, inputs and switches from there, without touching the JSON config.

- Before you add a TV, you can test the connection. If the connection is successful and the TV returns a MAC address, it is filled in automatically, unless you already typed one.
- Editing a TV keeps its MAC address exactly as it is written in the config. The TV's identity in Home is based on it, so an existing TV is never added to Home again because of a saved form.
- SmartThings is authorized from a step by step wizard in the same screen. Once it is connected, the interface loads your TVs from SmartThings so you can pick the Device ID, and loads that TV's picture modes, sound modes and input sources for custom switches and inputs.
- When the plugin has a list of installed apps for a TV, the interface shows them in a dropdown when you set an application on an input or a custom switch. You can still type an ID by choosing Other.
- `keys`, `inputs` and `switches` set at plugin level are still used by every device, and they now have their own tabs. Inputs and switches set on a device are added to the plugin-level ones. For `keys`, a value set on a device overrides the plugin-level one.
- Inputs and switches can be moved up and down in their lists. For inputs, this is the order they have in Home.
- The lists, the forms and the SmartThings wizard link to the matching pages of the documentation.
- If the child bridge option is turned on for the plugin, the interface shows a warning. Every TV is already published on its own, so the child bridge is not needed.

**New**

- The plugin is now written in TypeScript and shipped as an ES module.
- The state of the TV is now updated in real time through SSDP announcements. If those announcements never arrive or stop without a goodbye, the plugin falls back to checking whether the TV is reachable.
- Volume and mute are read in real time from the TV through DMR (UPnP) events, so the values in Home app follow the physical remote. For this the TV connects back to Homebridge, and the plugin gives each TV the Homebridge address that actually reaches it, so it also works on hosts with Docker, WireGuard or several network cards.
- Absolute volume control is now available without SmartThings.
- New option to add a slider that controls the TV volume. It shows in Home as a light: brightness sets the volume from 0 to 100, so it can be used in scenes and automations. Turning the light off mutes the TV, and turning it on unmutes it. The slider stays off while the TV is off. Enable it with `Volume.Slider.Enable`.
- The speaker now reports the same on/off state as the TV, so the volume buttons in the iOS Remote widget stay enabled when the TV is on.
- Custom switches can set a sound mode through SmartThings.
- New option to disable a device from the plugin without removing it from the configuration. Enable it with `Device.Disable`.
- Pairing no longer needs the TV to be on when Homebridge starts. If the TV is off, the plugin waits and opens the pairing prompt as soon as the TV turns on. If pairing fails, it is tried again the next time the TV turns on. A Deny is remembered by the TV, so in that case allow Homebridge from the TV's Device Connection Manager first.
- Remote `keys` now map every iOS Remote button Home shows for a TV. `REWIND`, `FAST_FORWARD` and `EXIT` have a default now.
- All dependencies were updated to their latest versions.

**Changed**

- Inputs and custom switches are identified in Home by what they do (source, app, commands, switch actions), not by their position in the config. Reordering the list only changes the order they appear in Home, and renaming one keeps it the same item in Home. Changing what it does makes it a new item, so a scene that used the old one has to be set again. An input or switch without a name is skipped and logged, instead of taking down the whole TV.
- A custom switch that has more than one option with a state, for example `sleep` together with `mute`, now shows as ON when any of those options is active. Before, all of them had to be active at the same time.
- Custom switches that launch an app, select an input source, set a picture mode, a sound mode or a TV channel now stay ON in Home while that app, source, picture mode, sound mode or channel is active on the TV. They are checked automatically while the TV is on. Turning one of them off in Home changes nothing on the TV, so the switch goes back to ON while it is still active. Command and volume switches still turn off after a short delay.
- Using a switch while the TV is off, when that switch is not set to turn the TV on, turns the switch back off. The log now has a warning that says why.
- When Home asks which input is active, the plugin now prioritizes inputs so it makes as few requests to the TV as possible to determine the active input.
- `device_id` was renamed to `deviceId`. The old name still works for now, but change it in your config.
- Custom switches that set a picture mode now store the SmartThings mode id (e.g. `modeMovie`) instead of its English display name, so the correct value is sent regardless of the TV's language. Existing switches with the old English names (`Dynamic`, `Standard`, `Natural`, `Movie`) keep working automatically.
- Digital TV now uses the SmartThings id `dtv` instead of `digitalTv`. `digitalTv` from an older config still works for now. To update it, open the input or switch in the configuration interface and save it again as `dtv`.
- At startup the plugin writes a warning to the log for every v5 setting still in your config: `api_key`, settings that are no longer used, and old values it still accepts for now (`device_id`, `type: art`, `digitalTv`). The warnings say what to change and end with a link to the [upgrade guide](https://tavicu.github.io/homebridge-samsung-tizen/extra/upgrading.html).

**Improved**

- SmartThings values for the active input, picture mode, sound mode and TV channel are ignored if they have not been updated in more than a day, so Home does not keep showing the last known source after the TV has been off or has lost its SmartThings connection.
- SmartThings recovers on its own when the internet connection or the SmartThings servers are down. The access token refresh is retried after 1, 5, 15 and 30 minutes, then every hour, until it succeeds. Requests to SmartThings give up after 5 seconds, so a slow response no longer holds up Home.
- If SmartThings rejects the access token before it expires, the plugin refreshes it and repeats the request once.
- If SmartThings rejects the authorization itself, the plugin stops retrying, writes it in the log, and the configuration interface shows the authorization as expired. After you go through the wizard again, the plugin picks up the new authorization without a Homebridge restart.
- The plugin saves its storage file only when a value actually changes.
- When you change plugin storage from the configuration interface, `samsung-tizen.json` is backed up first to `backups/samsung-tizen/`, keeping the last 10 backups. Saves made by the plugin itself (pairing tokens, cached device info) do not create a backup.

**Fixed**

- Opening the remote or the Frame art socket no longer hangs if the TV never sends a ready event. The plugin continues after the channel connects, and gives up after 30 seconds if nothing arrives.
- If the plugin cannot read whether the TV is on, it keeps the last known state. A failed check is no longer treated as the TV being on.
- Turning the TV on or off when it is already in that state, or while it is still switching, no longer makes Home app show "No Response". The command is ignored instead.
- The power switch in Home app no longer jumps back to off right after you turn the TV on, while the TV is still starting.
- Custom remote key mappings no longer leak between TVs. Each TV keeps its own `keys`.
- Custom switches now honor `mute: false` and unmute the TV. In v5 they always sent `KEY_MUTE`, so the value in the config had no effect. The configuration interface lets you pick None, Mute or Unmute.

**Settings that are no longer used**

These were removed and are ignored if they are still present in your configuration. The plugin lists the ones it finds in the log at startup, so you know what to remove:

- `refresh` - there is no configurable poll interval anymore. Power state arrives through SSDP, with a built-in fallback check when announcements are missing. Volume and mute arrive through DMR events. Switches that track an app, an input source, a picture mode, a sound mode or a TV channel are checked on a fixed internal interval, only while the TV is on.
- `delay`, `timeout` and `wait_time` - these timings are now handled internally.
- `method` and `port` - the connection to the TV is detected automatically.
- `api_key` - replaced by the SmartThings authorization flow described above.

## 5.3.5

- Ensure runtime compatibility with Node.js 22.22.0 and newer.
- Replace `node-fetch` and `timeout-signal` with native `fetch` and `AbortSignal.timeout()`.
- Remove deprecated `new Buffer.from(...)` usage.
- Remove obsolete HTTP dependencies to reduce transitive packages.

## 5.3.3

- Add SmartThings inputs (USB-C and DisplayPort) for Samsung Monitors

## 5.3.0

- Ensure compatibility of the plugin with Homebridge 2.0.
- Update the plugin's dependencies.

Apologies for the delay in updating the plugin to ensure compatibility with Homebridge 2.0.

For more information about the future plans for the plugin, please visit: [https://github.com/tavicu/homebridge-samsung-tizen/issues/696](https://github.com/tavicu/homebridge-samsung-tizen/issues/696).

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
