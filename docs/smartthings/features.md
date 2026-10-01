# SmartThings features

These features need the SmartThings account to be [connected](/smartthings/index.md), and a `deviceId` on the TV. Without them, an input or switch that uses one of these actions fails and writes an error in the log.

| Feature                                  | Used by                                                                                         | Without SmartThings                          |
| :--------------------------------------- | :---------------------------------------------------------------------------------------------- | :------------------------------------------- |
| [Input source](#input-source)            | [Inputs](/features/inputs.md#source) with `type: input`, [switches](/features/switches.md#input) with `input` | Not available                                |
| [Picture mode](#picture-mode)            | [Switches](/features/switches.md#picture-mode) with `picture_mode`                              | Not available                                |
| [Sound mode](#sound-mode)                | [Switches](/features/switches.md#sound-mode) with `sound_mode`                                  | Not available                                |
| [Channel](#channel)                      | [Switches](/features/switches.md#channel) with `channel`                                        | Digit keys are sent. The state is not read.  |
| [Frame power off](#frame-power-off)      | The Power switch, or the tile with `Frame.RealPowerMode`                                        | Long press of the power key                  |

Everything else works without SmartThings: power, volume, mute, apps, remote keys and Art Mode.

## Input source

Selects a source on the TV. Use it on an input with `type: input`, or on a switch with `input`.

| Value          | Source            |
| :------------- | :---------------- |
| `dtv`          | Digital TV        |
| `HDMI1`        | HDMI 1            |
| `HDMI2`        | HDMI 2            |
| `HDMI3`        | HDMI 3            |
| `HDMI4`        | HDMI 4            |
| `HDMI5`        | HDMI 5            |
| `HDMI6`        | HDMI 6            |
| `USB`          | USB               |
| `USB-C`        | USB-C (monitors)  |
| `Display Port` | DisplayPort (monitors) |

Your TV may report other ids. When you pick the source in the settings screen from a TV that has a `deviceId`, the list shows the sources that TV reports. See [In the settings screen](#in-the-settings-screen).

An input or a switch with a source is shown as active while SmartThings reports that source. Two cases are never shown as active:

- An app is open on top of the source.
- Digital TV is selected, but SmartThings does not report a channel.

::: tip Digital TV
Digital TV was `digitalTv` in version 5. It is now `dtv`. The old value still works for now and the log tells you where it is used. Open the input or switch in the settings screen and save it again to change it.
:::

```json
{
  "inputs": [
    { "name": "Live TV", "type": "input", "value": "dtv" },
    { "name": "Xbox", "type": "input", "value": "HDMI1" }
  ],
  "switches": [
    { "name": "PlayStation", "power": true, "input": "HDMI2" }
  ]
}
```

## Picture mode

Sets the picture mode with a switch. The value is the SmartThings mode id, for example `modeMovie`. The id is the same in every language, so the switch keeps working if the TV menu is not in English.

The modes depend on the TV. The common ones are:

| Value          | Mode     |
| :------------- | :------- |
| `modeDynamic`  | Dynamic  |
| `modeStandard` | Standard |
| `modeNatural`  | Natural  |
| `modeMovie`    | Movie    |

Configs from version 5 that use the English names `Dynamic`, `Standard`, `Natural` and `Movie` keep working. They are sent as the ids above.

The switch stays ON while that picture mode is active.

```json
{ "name": "Movie picture", "picture_mode": "modeMovie" }
```

## Sound mode

Sets the sound mode with a switch. The value is the SmartThings mode id. The common ones are:

| Value          | Mode     |
| :------------- | :------- |
| `modeStandard` | Standard |
| `modeSmart`    | Smart    |
| `modeAmplify`  | Amplify  |

The switch stays ON while that sound mode is active.

```json
{ "name": "Clear voice", "sound_mode": "modeAmplify" }
```

## Channel

A switch with `channel` changes the channel through SmartThings. It stays ON while the TV is on Digital TV and on that channel.

Without SmartThings the plugin sends the digit keys followed by Enter. It cannot read the current channel, so the switch turns off again at the next check.

```json
{ "name": "News", "channel": 13 }
```

## Frame power off

Samsung does not allow turning a Frame fully off through the local API. Holding the power key only switches Art Mode on newer models.

With SmartThings and a `deviceId`, the Power switch and the tile with `Frame.RealPowerMode` turn the Frame fully off through SmartThings. Turning it on still uses the local network. See [Frame TVs](/configuration/frame-tvs.md).

## In the settings screen

When you add or edit an input or a switch from a TV's own tab, and that TV has a `deviceId`, the settings screen loads from SmartThings:

- the input sources the TV reports, under **Available**, with the rest of the default list under **Other**
- the picture modes the TV reports
- the sound modes the TV reports

Global inputs and switches, added from the dashboard, apply to every TV, so there is no single TV to load the lists from. For them the settings screen shows the default lists from this page.

## How the state is read

The plugin asks SmartThings for the TV status when Home needs it, for example to show the active input. Switches that depend on it are also checked every 15 seconds while the TV is on. Each time, it first asks SmartThings to refresh the status from the TV. Requests are made at most once every few seconds, and they give up after 5 seconds, so a slow response does not hold up Home.

SmartThings keeps the last value it received, even after the TV turns off or goes offline. The plugin ignores values for the source, picture mode, sound mode and channel that were not updated in the last 24 hours. Otherwise Home would keep showing an old source.

Because the state comes from the cloud, it can lag a few seconds behind the TV.
