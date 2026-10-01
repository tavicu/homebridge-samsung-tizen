# Switches

A custom switch is an extra accessory on the TV. One switch can run several actions.

By default the switch name in Home is the TV name plus the name you set. `Switch.DeviceName.Disable` in the TV options uses only the switch name.

Switches set on the plugin are created for every TV. A list on a device replaces that list for that TV. Home identifies a switch by its actions, not by its name or its place in the list. Renaming it does not create a new accessory. An unnamed switch is skipped and written to the log.

This example sets a 60 minute sleep timer, mutes the TV, sends a remote key, and changes the channel:

```json
{
  "name": "Movie night",
  "sleep": 60,
  "mute": true,
  "command": "KEY_16_9",
  "channel": 13
}
```

The switch shows ON when **any** action that has a state is active. Sleep together with mute is ON if the timer is running or the TV is muted. It does not wait until both are active.

These stay ON while they match the TV, and they are checked every 15 seconds while the TV is on:

- application
- input source
- picture mode
- sound mode
- channel

Mute follows the live mute state. Sleep stays ON until the timer ends or the TV turns off. Command and volume switches have no state to read, so they turn off about half a second after they run.

If the TV is off and the switch does not turn it on, the switch goes back to OFF and a warning is written to the log. Home does not show a failed accessory.

## Settings

| Name                          | Description                               |
| :---------------------------- | :---------------------------------------- |
| [name](#name)                 | Name of the switch                        |
| [power](#power)               | Turn the TV on before the other actions   |
| [sleep](#sleep)               | Turn the TV off after a number of minutes |
| [mute](#mute)                 | Mute or unmute                            |
| [volume](#volume)             | Set the volume                            |
| [app](#application)           | Open an application                       |
| [input](#input)               | Select a source                           |
| [channel](#channel)           | Switch to a channel                       |
| [picture_mode](#picture-mode) | Set the picture mode                      |
| [sound_mode](#sound-mode)     | Set the sound mode                        |
| [command](#command)           | Send one or more remote keys              |

### name

**(Required)** The name in Home. The TV name is placed in front of it unless you set `Switch.DeviceName.Disable`.

- Type: `string`
- Example: `Sleep`

## Actions

### power

When this is `true`, the TV is turned on before the other actions. There is a short wait after power-on so the next command has a TV that is ready.

If this is omitted or `false`, and the TV is off, the switch turns back off and nothing else runs.

- Type: `boolean`
- Default: `false`

```json
{ "name": "Volume up", "power": true, "command": "KEY_VOLUP" }
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

`true` mutes when the switch turns on. `false` unmutes. Leave the key out for no mute action.

In version 5 this always sent `KEY_MUTE`, so the value did not matter. The settings screen offers **None**, **Mute**, and **Unmute**.

Mute state comes from the TV, so the switch follows the physical remote.

- Type: `boolean`

```json
{ "name": "Mute", "mute": true }
```

```json
{ "name": "Unmute", "mute": false }
```

### volume

Sets the speaker volume from 0 to 100. This uses the local TV API and does not need SmartThings. The switch turns off shortly after it runs, because a volume level is not tracked as a switch state. For a slider that stays at the current level, see [Volume](/features/volume.md).

- Type: `integer`
- Minimum: `0`
- Maximum: `100`
- Example: `10`

```json
{ "name": "Volume 10", "volume": 10 }
```

### application

Opens an installed app. Ids are on the [Applications](/extra/applications.md) page. When the plugin has already stored the apps for that TV, the settings screen lists them. **Other** lets you type an id.

The switch stays ON while that app is in front.

- Type: `string`
- Example: `11101200001`

```json
{ "name": "Netflix", "app": "11101200001" }
```

### input

::: warning
This action needs [SmartThings](/configuration/smartthings-api.md) and a `deviceId` on the TV.
:::

Selects a source. The switch stays ON while that source is active.

Digital TV is `dtv`. `digitalTv` from an older config has to be saved again as Digital TV.

- Type: `string`
- Example: `HDMI1`
- Values: `dtv`, `USB`, `USB-C`, `Display Port`, `HDMI1`, `HDMI2`, `HDMI3`, `HDMI4`, `HDMI5`, `HDMI6`

```json
{ "name": "Xbox", "input": "HDMI1" }
```

### channel

Changes to a channel number. The switch stays ON while that channel is playing.

With SmartThings, the channel is set through the API. Without it, the plugin sends the digit keys and then Enter.

- Type: `integer`
- Minimum: `1`
- Example: `13`

```json
{ "name": "Channel 13", "channel": 13 }
```

### picture mode

::: warning
This action needs [SmartThings](/configuration/smartthings-api.md) and a `deviceId` on the TV.
:::

Sets the picture mode. Store the SmartThings mode id, for example `modeMovie`, so the command is right no matter which language the TV uses. The settings screen lists the modes that TV reports.

Older configs that used the English names `Dynamic`, `Standard`, `Natural`, and `Movie` still work. They are sent as `modeDynamic`, `modeStandard`, `modeNatural`, and `modeMovie`.

The switch stays ON while that mode is active.

- Type: `string`
- Example: `modeMovie`

```json
{ "name": "Movie picture", "picture_mode": "modeMovie" }
```

### sound mode

::: warning
This action needs [SmartThings](/configuration/smartthings-api.md) and a `deviceId` on the TV.
:::

Sets the sound mode, using the SmartThings mode id. The settings screen lists the modes that TV reports. Common ids are `modeStandard`, `modeSmart`, and `modeAmplify`. The switch stays ON while that mode is active.

- Type: `string`
- Example: `modeStandard`

```json
{ "name": "Standard sound", "sound_mode": "modeStandard" }
```

### command

Sends remote keys. The list is on the [Commands](/extra/commands.md) page. The switch turns off shortly after the keys are sent.

- Type: `string` or a list of strings
- Example: `KEY_VOLUP`

One key:

```json
{ "name": "Volume up", "command": "KEY_VOLUP" }
```

Several keys, as a string or a list:

```json
{ "name": "Several keys", "command": "KEY_LEFT,KEY_RIGHT,KEY_UP" }
```

Repeat a key. This sends `KEY_VOLUP` five times:

```json
{ "name": "Volume up", "command": "KEY_VOLUP*5" }
```

Hold a key. The number is seconds, so two minutes is `120s`:

```json
{ "name": "Hold volume", "command": "KEY_VOLUP*5s" }
```
