# Switches

A custom switch is an extra switch on the TV accessory. One switch can run several actions, for example turn the TV on, set the volume and open an app.

Global switches, set on the **Switches** tab of the dashboard, are added to every TV. Switches on a TV's own **Switches** tab are added on top of them, for that TV only. See [Platform and device settings](/configuration/device-settings.md#platform-and-device-settings).

By default the switch name in Home is the TV name followed by the name you set. With `Switch.DeviceName.Disable` in the TV options, only the switch name is used.

Home identifies a switch by its actions, not by its name or its place in the list. Renaming a switch keeps it the same in Home. Changing its actions makes it a new switch, so scenes that used it have to be set again. A switch with no name is skipped and written to the log.

This example sets a 60 minute sleep timer, mutes the TV, and changes the channel:

```json
{
  "name": "Movie night",
  "sleep": 60,
  "mute": true,
  "channel": 13
}
```

## How a switch works

### Turning it on

The actions run in this order, with a short pause between them: [power](#power), [sleep](#sleep), [mute](#mute), [app](#application), [input](#input), [channel](#channel), [picture mode](#picture-mode), [sound mode](#sound-mode), [volume](#volume), [command](#command). The order in your config does not matter.

If the TV is off and the switch does not have `power`, nothing runs. The switch goes back to OFF and a warning is written to the log. Home does not show it as a failed accessory.

### Turning it off

Only two actions have an opposite:

- **sleep** cancels the timer.
- **mute** does the opposite of what the switch does. A mute switch unmutes, an unmute switch mutes.

The other actions do nothing when the switch is turned off. The TV keeps the app, source, channel or mode it has. The switch then reads the TV again and shows the real state.

### The state in Home

The switch is ON when **any** of its actions that has a state matches the TV. A switch with sleep and mute is ON while the timer runs or while the TV is muted. It does not wait for both.

| Action                       | The switch is ON while                     |
| :--------------------------- | :----------------------------------------- |
| sleep                        | the timer is running                       |
| mute                         | the TV mute matches the switch             |
| app                          | that app is in front                       |
| input                        | that source is active                      |
| channel                      | that channel is playing                    |
| picture mode                 | that picture mode is active                |
| sound mode                   | that sound mode is active                  |

App, source, channel and modes are checked every 15 seconds while the TV is on. Mute follows the TV as soon as it changes, including from the physical remote.

Power, volume and command have no state to read. A switch with only these actions turns off about half a second after it runs.

## Settings

| Name                          | Description                               |
| :---------------------------- | :---------------------------------------- |
| [name](#name)                 | Name of the switch                        |
| [power](#power)               | Turn the TV on before the other actions   |
| [sleep](#sleep)               | Turn the TV off after a number of minutes |
| [mute](#mute)                 | Mute or unmute                            |
| [volume](#volume)             | Set the volume                            |
| [app](#application)           | Open an application                       |
| [input](#input)               | Select a source. Needs SmartThings.       |
| [channel](#channel)           | Switch to a channel                       |
| [picture_mode](#picture-mode) | Set the picture mode. Needs SmartThings.  |
| [sound_mode](#sound-mode)     | Set the sound mode. Needs SmartThings.    |
| [command](#command)           | Send one or more remote keys              |

A switch needs a name and at least one action.

### name

**(Required)** The name in Home. The TV name is placed in front of it unless you set `Switch.DeviceName.Disable`.

- Type: `string`
- Example: `Sleep`

## Actions

### power

When this is `true` and the TV is off, the TV is turned on first. The plugin then waits 3 seconds, so the next actions reach a TV that is ready. If the TV is already on, nothing is sent.

Turning the switch off does not turn the TV off. Use [sleep](#sleep) for that.

In the settings screen this is **Power on TV before running actions**.

- Type: `boolean`
- Default: `false`

```json
{ "name": "Netflix", "power": true, "app": "11101200001" }
```

### sleep

Turns the TV off after the given number of minutes. The switch stays ON while the timer is running. Turning the switch off cancels the timer. If the TV turns off sooner, the timer is cleared.

- Type: `integer`
- Minimum: `1`
- Example: `60`

```json
{ "name": "Sleep", "sleep": 60 }
```

### mute

`true` mutes the TV when the switch turns on. `false` unmutes it. Leave the key out for no mute action. In the settings screen the options are **None**, **Mute** and **Unmute**.

The switch follows the TV. A mute switch is ON while the TV is muted. An unmute switch is ON while the TV is not muted.

- Type: `boolean`

```json
{ "name": "Mute", "mute": true }
```

```json
{ "name": "Unmute", "mute": false }
```

### volume

Sets the speaker volume from 0 to 100. This uses the TV's local API and does not need SmartThings. The switch turns off shortly after it runs. For a slider that stays at the current level, see [Volume](/features/volume.md#volume-slider).

- Type: `integer`
- Minimum: `0`
- Maximum: `100`
- Example: `10`

```json
{ "name": "Volume 10", "volume": 10 }
```

### application

Opens an installed app. Some app ids are on the [Applications](/extra/applications.md) page.

When you add the switch from a TV's own **Switches** tab, the settings screen lists the apps installed on that TV, if the TV has reported them. Choose **Other** to type an id.

The switch stays ON while that app is in front.

- Key: `app`
- Type: `string`
- Example: `11101200001`

```json
{ "name": "Netflix", "app": "11101200001" }
```

### input

::: warning
This action needs [SmartThings](/smartthings/index.md) and a `deviceId` on the TV.
:::

Selects a source. The switch stays ON while that source is active. The values are on the [SmartThings features](/smartthings/features.md#input-source) page.

- Type: `string`
- Example: `HDMI1`
- Values: `dtv`, `HDMI1`, `HDMI2`, `HDMI3`, `HDMI4`, `HDMI5`, `HDMI6`, `USB`, `USB-C`, `Display Port`

```json
{ "name": "Xbox", "input": "HDMI1" }
```

### channel

Changes to a channel number.

With SmartThings, the channel is set through the API, and the switch stays ON while the TV is on that channel. Without it, the plugin sends the digit keys followed by Enter. It cannot read the current channel, so the switch turns off again at the next check. See [SmartThings features](/smartthings/features.md#channel).

- Type: `integer`
- Minimum: `1`
- Example: `13`

```json
{ "name": "Channel 13", "channel": 13 }
```

### picture mode

::: warning
This action needs [SmartThings](/smartthings/index.md) and a `deviceId` on the TV.
:::

Sets the picture mode, using the SmartThings mode id, for example `modeMovie`. The switch stays ON while that mode is active. The common ids, and how older configs are handled, are on the [SmartThings features](/smartthings/features.md#picture-mode) page.

- Key: `picture_mode`
- Type: `string`
- Example: `modeMovie`

```json
{ "name": "Movie picture", "picture_mode": "modeMovie" }
```

### sound mode

::: warning
This action needs [SmartThings](/smartthings/index.md) and a `deviceId` on the TV.
:::

Sets the sound mode, using the SmartThings mode id, for example `modeStandard`. The switch stays ON while that mode is active. See [SmartThings features](/smartthings/features.md#sound-mode).

- Key: `sound_mode`
- Type: `string`
- Example: `modeStandard`

```json
{ "name": "Standard sound", "sound_mode": "modeStandard" }
```

### command

Sends remote keys, after all the other actions. The list is on the [Commands](/extra/commands.md) page. A switch with only commands turns off shortly after the keys are sent.

- Type: `array` of strings
- Example: `["KEY_VOLUP"]`

One key:

```json
{ "name": "Info", "command": ["KEY_INFO"] }
```

Several keys, sent one after the other. In the settings screen each key is a row:

```json
{ "name": "Several keys", "command": ["KEY_LEFT", "KEY_RIGHT", "KEY_UP"] }
```

Repeat a key. This sends `KEY_VOLUP` five times:

```json
{ "name": "Volume up", "command": ["KEY_VOLUP*5"] }
```

Hold a key. The number is seconds and can have decimals. This holds `KEY_VOLUP` for two and a half seconds:

```json
{ "name": "Hold volume up", "command": ["KEY_VOLUP*2.5s"] }
```
