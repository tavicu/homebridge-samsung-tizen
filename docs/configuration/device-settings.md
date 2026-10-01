# Settings

The settings screen in Homebridge UI writes all of these for you. This page describes each key, for when you edit `config.json` by hand or want to know what an option does.

Some keys are set on the platform, some on each TV, and some on both.

| Name                            | Where    | Required | Description                               |
| :------------------------------ | :------- | :------- | :---------------------------------------- |
| [name](#name)                   | Device   | **Yes**  | Name of the TV                            |
| [ip](#ip)                       | Device   | **Yes**  | IP address of the TV                      |
| [mac](#mac)                     | Device   | **Yes**  | MAC address of the TV                     |
| [uuid](#uuid)                   | Device   | -        | Extra string mixed into the HomeKit id    |
| [deviceId](#deviceid)           | Device   | -        | SmartThings device ID                     |
| [options](#options)             | Device   | -        | Flags that change the default behavior    |
| [inputs](#inputs)               | Both     | -        | Custom inputs                             |
| [switches](#switches)           | Both     | -        | Custom switches                           |
| [keys](#keys)                   | Both     | -        | Remote button mapping                     |
| [clientId](#clientid-and-clientsecret)     | Platform | -        | SmartThings OAuth client ID       |
| [clientSecret](#clientid-and-clientsecret) | Platform | -        | SmartThings OAuth client secret   |

## Platform and device settings

`inputs`, `switches` and `keys` can be set on the platform, on a TV, or on both.

- **Inputs and switches** set on the platform are added to every TV. Inputs and switches set on a TV are added on top of them, for that TV only.
- **Keys** set on the platform apply to every TV. A key set on a TV replaces the same key from the platform, for that TV only.

In the settings screen, the **Inputs**, **Switches** and **Remote Keys** tabs on the dashboard hold the global settings, saved on the platform. The tabs with the same names inside a TV are the settings for that TV. An input or switch set on a TV is listed only when you edit that TV.

::: tip
If the same input or switch is set both on the platform and on a TV, that TV gets it twice.
:::

```json
{
  "platform": "SamsungTizen",
  "inputs": [
    { "name": "Netflix", "type": "app", "value": "11101200001" }
  ],
  "devices": [
    {
      "name": "Bedroom TV",
      "ip": "10.20.30.40",
      "mac": "A0:B1:C2:D3:E4:F5",
      "inputs": [
        { "name": "YouTube", "type": "app", "value": "111299001912" }
      ]
    }
  ]
}
```

In this example the bedroom TV has two inputs: Netflix from the platform and YouTube from its own list.

## name

**(Required)** The name shown in Home. It is also placed in front of the custom switch names, unless you set `Switch.DeviceName.Disable`.

- Type: `string`
- Example: `Bedroom TV`

```json
{
  "name": "Bedroom TV"
}
```

## ip

**(Required)** The IP address of the TV. Give the TV a static address on your router, so it does not change after a restart.

- Type: `string`
- Example: `192.168.1.100`

```json
{
  "ip": "192.168.1.100"
}
```

## mac

**(Required)** The MAC address of the TV, with the bytes separated by `:`. It is used to turn the TV on with Wake on LAN.

The TV's identity in Home is built from this value. If you change it, even only from lowercase to uppercase, Home sees a new TV and you have to add it again. The settings screen keeps the MAC exactly as it is written when you edit a TV, for that reason.

- Type: `string`
- Example: `A0:B1:C2:D3:E4:F5`

```json
{
  "mac": "A0:B1:C2:D3:E4:F5"
}
```

## uuid

The TV's identity in Home is built from its MAC address. If the TV was removed from Home, Home may refuse to add it again. Set any string here and the identity becomes the MAC plus this value, so Home sees a new accessory.

Changing or removing `uuid` later also creates a new accessory, so use it only when you need it. See [The TV does not appear when I try to add it in Home](/troubleshooting/common-issues.md#the-tv-does-not-appear-when-i-try-to-add-it-in-home).

- Type: `string`
- Example: `a1`

```json
{
  "uuid": "a1"
}
```

## deviceId

The SmartThings device ID of this TV. It is needed only for the [SmartThings features](/smartthings/features.md). In the settings screen you can pick it from a list once SmartThings is connected. See [Pick the TV](/smartthings/index.md#pick-the-tv).

In version 5 this key was `device_id`. The old name still works for now, and the log tells you to rename it.

- Type: `string`
- Example: `5d9215vx-c421-412a-a998-c4ec48754f08`

```json
{
  "deviceId": "5d9215vx-c421-412a-a998-c4ec48754f08"
}
```

## options

A list of flags for this TV. In the settings screen they are the switches at the bottom of the TV settings, visible when you edit a TV.

| Option                      | Settings screen                                     | What it does                                                                                                   |
| :-------------------------- | :-------------------------------------------------- | :------------------------------------------------------------------------------------------------------------- |
| `Device.Disable`            | Disable device from processing                      | The plugin skips this TV without removing it from the config. Home shows it as not responding until you enable it again. |
| `Volume.Slider.Enable`      | Create a slider that controls the TV volume         | Adds a light whose brightness is the TV volume. See [Volume](/features/volume.md#volume-slider).               |
| `Switch.DeviceName.Disable` | Disable prepending device name on custom switches   | Custom switches use only their own name, without the TV name in front.                                         |
| `Frame.RealPowerMode`       | Use the TV tile to turn a Frame fully on and off    | The tile turns the Frame fully on and off, instead of switching Art Mode. See [Frame TVs](/configuration/frame-tvs.md). |
| `Frame.ArtSwitch.Disable`   | Hide the Art Mode switch                            | Removes the Art Mode switch on a Frame.                                                                        |
| `Frame.PowerSwitch.Disable` | Hide the Power switch                               | Removes the Power switch on a Frame.                                                                           |

- Type: `array`
- Default: `[]`

```json
{
  "name": "Frame TV",
  "ip": "10.20.30.40",
  "mac": "A0:B1:C2:D3:E4:F5",
  "options": [
    "Switch.DeviceName.Disable",
    "Volume.Slider.Enable",
    "Frame.RealPowerMode"
  ]
}
```

## inputs

Custom inputs. See [Inputs](/features/inputs.md).

- Type: `array`
- Default: `[]`

```json
{
  "inputs": [
    { "name": "Netflix", "type": "app", "value": "11101200001" }
  ]
}
```

## switches

Custom switches. See [Switches](/features/switches.md).

- Type: `array`
- Default: `[]`

```json
{
  "switches": [
    { "name": "Sleep", "sleep": 60 }
  ]
}
```

## keys

Remote button mapping. See [Keys](/features/keys.md). Leave a button out to keep the default.

- Type: `object`
- Default: `{}`

```json
{
  "keys": {
    "SELECT": "KEY_ENTER"
  }
}
```

## clientId and clientSecret

The OAuth client ID and secret of your SmartThings app. They are set on the platform, once for every TV. The settings screen saves them when you go through the SmartThings wizard. See [SmartThings integration](/smartthings/index.md).

- Type: `string`

```json
{
  "platform": "SamsungTizen",
  "clientId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "clientSecret": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
}
```
