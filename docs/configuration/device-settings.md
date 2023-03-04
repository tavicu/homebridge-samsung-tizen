---
sidebarDepth: 0
---

# Device settings

| Name                    | Required | Description                                               |
| :---------------------- | :------- | :-------------------------------------------------------- |
| [name](#name)           | **Yes**  | Name of the device                                        |
| [ip](#ip)               | **Yes**  | IP address of the device                                  |
| [mac](#mac)             | **Yes**  | MAC address of the device                                 |
| [uuid](#uuid)           | -        | Option to change UUID                                     |
| [options](#options)     | -        | Options that allows you to change the default behavior    |
| [api_key](#api_key)     | -        | Api key for SmartThings                                   |
| [device_id](#device_id) | -        | Device ID for SmartThings                                 |
| [inputs](#inputs)       | -        | Custom inputs                                             |
| [switches](#switches)   | -        | Custom switches                                           |
| [keys](#keys)           | -        | Changing the default keys for buttons from Remote Control |
| [delay](#delay)         | -        | The delay between commands in miliseconds                 |
| [refresh](#refresh)     | -        | Intervals for refreshing accessories in the background    |

## name

**(Required)** The name of the device. It will appear in Home app and also will be used in the name of the custom switches.

- Type: `string`
- Example: `Bedroom TV`

``` json
{
    "name": "Frame TV"
}
```

## ip

**(Required)** The IP address of the device. Make sure to assign a static IP from your router settings.

- Type: `string`
- Example: `192.168.1.100`

``` json
{
    "ip": "192.168.1.100"
}
```

## mac

**(Required)** The MAC address of the device. This is required to power on the TV.

You need to use `:` as a separator.

- Type: `string`
- Example: `A0:B1:C2:D3:E4:F5`

``` json
{
    "mac": "A0:B1:C2:D3:E4:F5"
}
```

## uuid

Each device have a unique id that is used by Home app for pairing. By default UUID is created from the MAC address since this is unique for each TV.

But there are times when the TV was unpaired from Home app but not from the Homebridge server. This will result in not being able to add the accessory again in Home app.

That's why we added this key where you can set a string and the new UUID will be created by merging the MAC address and this key. You can set whatever you want here.

- Type: `string`
- Example: `a1`

``` json
{
    "uuid": "a1"
}
```

## options

With this list you can select some options that change the default behavior of the plugin for a device.

- Type: `list`
- Default: `[]`

Possible options:

- `Switch.DeviceName.Disable` - By default all custom switches have the main device prepended to the name. With this option you can disable this and create the switch only with the name you select in config file for the switch.

- `Frame.ArtSwitch.Disable` - Remove the default Art Mode Switch that is created by default for Frame TVs

- `Frame.PowerSwitch.Disable` - Remove the default Power Switch that is created by default for Frame TVs

- `Frame.RealPowerMode` - Change the main accessory behaivor for Frame TVs and control the real power of TV

``` json
{
    "name": "Frame TV",
    "ip": "10.20.30.40",
    "mac": "A0:B1:C2:D3:E4:F5",
    "options": [
        "Switch.DeviceName.Disable",
        "Frame.RealPowerMode",
        "Frame.ArtSwitch.Disable",
        "Frame.PowerSwitch.Disable"
    ]
}
```

## api_key

This option is to set the api key for SmartThings API. Read more and how to setup SmartThings [over here](/configuration/smartthings-api.md).

- Type: `string`
- Example: `e2c3de7e-05e2-4690-8ee7-8d4355f992b9`

``` json
{
    "api_key": "e2c3de7e-05e2-4690-8ee7-8d4355f992b9"
}
```

## device_id

Option to set the device ID for SmartThings API. Read more and how to setup SmartThings [over here](/configuration/smartthings-api.md).

- Type: `string`
- Example: `5d9215vx-c421-412-a998-c4ec48754f08`

``` json
{
    "device_id": "5d9215vx-c421-412-a998-c4ec48754f08"
}
```

## inputs

Set custom inputs for the TV. You can read more on [Inputs page](/features/inputs.md).

- Type: `list`
- Default: `[]`

``` json
{
    "inputs": [
        {"name": "Netflix", "type": "app", "value": "11101200001"}
    ]
}
```

## switches

Create custom switches for the TV. You can read more on [Switches page](/features/switches.md).

- Type: `list`
- Default: `[]`

``` json
{
    "switches": [
        {"name": "Sleep", "sleep": 10}
    ]
}
```

## keys

Changing the default keys for buttons from Remote Control. You can read more on [Keys page](/features/keys.md).

- Type: `list`
- Default: `{}`

``` json
{
    "keys": {
        "SELECT": "KEY_ENTER"
    }
}
```

## delay

The delay between commands in miliseconds.

- Type: `number`
- Default: `400`

``` json
{
    "delay": 400
}
```

## refresh

Intervals for refreshing accessories in the background.

By default the main accessory will be refreshed every **5 seconds** and the custom switches will refresh every **30 seconds**. I don't recomment changing the values to something lower because it will flood the TV with requests.

The minimum value is `500` *(0.5 seconds)* for main accessory and `1000` *(1 seconds)* for custom switches.

- Type: `object`
- Default: `{main: 5000, switch: 30000}`

``` json
{
    "refresh": {
        main: 5000,
        switch: 30000
    }
}
```
