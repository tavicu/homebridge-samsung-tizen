# Switches

Switches allows you to create custom accessories with actions that can't be done with the main accessory.

A custom switch can execute multiple or even all actions.

This for example will: Set a sleep time for 60 minutes, mute the TV, change the aspect ratio to 16:9 and switch the TV to channel 13.
``` json
{"name": "Multiple", "sleep": 60, "mute": true, "command": "KEY_16_9", "channel": 13}
```

## Settings

| Name                          | Description                                     |
| :---------------------------- | :---------------------------------------------- |
| [name](#name)                 | Name of the switch                              |
| [power](#power)               | Power on TV before running actions              |
| [sleep](#sleep)               | This will turn OFF the TV after a specific time |
| [mute](#mute)                 | Send the mute command                           |
| [volume](#volume)             | Set audio volume of TV                          |
| [app](#application)           | Open a selected application                     |
| [input](#input)               | Select a specific input source                  |
| [channel](#channel)           | Switch TV to a channel                          |
| [picture_mode](#picture-mode) | Set picture mode of TV                          |
| [command](#command)           | Send command(s) to TV                           |

### name
**(Required)** The name of the switch to be used in Home app. The main device name will be appended to the switch name.

- Type: `string`
- Example: `My Switch`


## Actions

### power

By default a switch will throw an error if the TV is OFF.

Setting the `power` parameter to `true` will first turn ON the TV then run other actions.

- Type: `boolean`
- Default `false`
- Possible values: `true` / `false`

``` json
{"name": "My Switch", "power": true, "command": "KEY_VOLUP"}
```

### sleep

This allows you to set sleep command and turn OFF the TV after a specific time. The value is in **minutes**.

- Type: `number`
- Example `10`

``` json
{"name": "Sleep", "sleep": 10}
```

### mute

This action sends the `KEY_MUTE` to TV.

Unfortunately there is no method to get the state of volume from the TV.

This results in a **toggle** command. This means that if your TV is already on mute and you switch this accessory, it will unmute it.

- Type: `boolean`
- Default `false`
- Possible values: `true` / `false`

``` json
{"name": "Mute", "mute": true}
```

### volume

::: warning
In order to use this type of action you must have [SmartThings API](/configuration/smartthings-api.md) configured.
:::

Set the speaker volume of TV.

- Type: `number`
- Example: `10`

``` json
{"name": "Volume 10", "volume": 10}
```

### application

This option allow you to open an installed application. You can find a list with applications on the [Applications page](/extra/applications.md).

- Type: `string`
- Example `11101200001`

``` json
{"name": "Netflix", "app": "11101200001"}
```

### input

::: warning
In order to use this type of action you must have [SmartThings API](/configuration/smartthings-api.md) configured.
:::

Select a specific input source. 

- Type: `string`
- Example `HDMI1`
- Possible values: `digitalTv` / `USB` / `HDMI1` / `HDMI2` / `HDMI3` / `HDMI4` / `HDMI5` / `HDMI6`

``` json
{"name": "My Xbox", "input": "HDMI1"}
```

### channel

Change the TV to a specific channel.

- Type: `number`
- Example `13`

``` json
{"name": "Channel 13", "channel": 13}
```

### picture_mode

::: warning
In order to use this type of action you must have [SmartThings API](/configuration/smartthings-api.md) configured.
:::

Set the picture mode of TV.

- Type: `string`
- Example `Standard`
- Possible values: `Dynamic` / `Standard` / `Natural` / `Movie`

``` json
{"name": "Picture Movie", "picture_mode": "Movie"}
```

### command

Send commands to TV. You can find a list with known commands on the [Commands page](/extra/commands.md).

- Type: `string`
- Example `KEY_VOLUP`

Example of sending a command
```
{"name": "Vol Up", "command": "KEY_VOLUP"}
```

Example of sending multiple commands
```
{"name": "Multiple commands", "command": "KEY_LEFT,KEY_RIGHT,KEY_UP"}
```

Example of sending a command multiple times. This will send the command `KEY_VOLUP` **5 times**
```
{"name": "Vol Up", "command": "KEY_VOLUP*5"}
```

Example of holding a key for 5 seconds
```
{"name": "Vol Up", "command": "KEY_VOLUP*5s"}
```