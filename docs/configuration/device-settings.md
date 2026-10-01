---
sidebarDepth: 0
---

# Device settings

Settings on the platform apply to every TV. The same keys on a device apply only to that TV. `clientId` and `clientSecret` belong on the platform. See [SmartThings](/configuration/smartthings-api.md).

| Name                          | Where      | Required | Description                                      |
| :---------------------------- | :--------- | :------- | :----------------------------------------------- |
| [name](#name)                 | Device     | **Yes**  | Name of the TV                                   |
| [ip](#ip)                     | Device     | **Yes**  | IP address of the TV                             |
| [mac](#mac)                   | Device     | **Yes**  | MAC address of the TV                            |
| [uuid](#uuid)                 | Device     | -        | Extra string mixed into the HomeKit id          |
| [deviceId](#deviceid)         | Device     | -        | SmartThings device id                           |
| [options](#options)           | Device     | -        | Flags that change the default behavior          |
| [inputs](#inputs)             | Both       | -        | Custom inputs                                    |
| [switches](#switches)         | Both       | -        | Custom switches                                  |
| [keys](#keys)                 | Both       | -        | Remote button mapping                            |

`inputs`, `switches`, and `keys` on the platform are inherited by every TV. A device list for `inputs` or `switches` replaces the platform list for that TV. `keys` are merged, and a value on the device overrides the same value from the platform.

## name

**(Required)** The name shown in Home, and the prefix used on custom switches unless you disable that.

- Type: `string`
- Example: `Bedroom TV`

```json
{
    "name": "Bedroom TV"
}
```

## ip

**(Required)** The IP address of the TV. Assign a static address on the router.

- Type: `string`
- Example: `192.168.1.100`

```json
{
    "ip": "192.168.1.100"
}
```

## mac

**(Required)** The MAC address of the TV. Separate the bytes with `:`.

- Type: `string`
- Example: `A0:B1:C2:D3:E4:F5`

```json
{
    "mac": "A0:B1:C2:D3:E4:F5"
}
```

## uuid

HomeKit identifies the TV from its MAC address. If the TV was removed in Home but is still paired in Homebridge, Home may refuse to add it again. Set any string here and the id becomes the MAC plus this value.

- Type: `string`
- Example: `a1`

```json
{
    "uuid": "a1"
}
```

## deviceId

The SmartThings device id for this TV. See [SmartThings](/configuration/smartthings-api.md).

- Type: `string`
- Example: `5d9215vx-c421-412a-a998-c4ec48754f08`

```json
{
    "deviceId": "5d9215vx-c421-412a-a998-c4ec48754f08"
}
```

## options

A list of flags for this TV. The default is an empty list.

- `Device.Disable` skips the TV without deleting it from the config
- `Volume.Slider.Enable` adds a slider for the volume. See [Volume](/features/volume.md)
- `Switch.DeviceName.Disable` stops prefixing custom switches with the TV name
- `Frame.RealPowerMode` makes the Home tile turn a Frame fully on and off. See [Frame TVs](/configuration/frame-tvs.md)
- `Frame.ArtSwitch.Disable` hides the Art Mode switch
- `Frame.PowerSwitch.Disable` hides the Power switch

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
        {"name": "Netflix", "type": "app", "value": "11101200001"}
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
        {"name": "Sleep", "sleep": 60}
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
