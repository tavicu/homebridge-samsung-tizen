# Inputs

::: tip
After you add inputs, HomeKit can take a while to attach them to the TV. Force-quit the Home app and open it again. If they are still separate, wait. They attach on their own.
:::

You can add inputs that open an [application](#application), send [commands](#command), select a [source](#source) such as HDMI, or turn on [Art Mode](#art-mode) on a Frame.

Inputs set on the plugin apply to every TV. A list on a device replaces that list for that TV. Home identifies an input by its type and value, not by its name or its position. Renaming it keeps the same input. Reordering only changes the order in Home. An input with no name is skipped and written to the log.

When the plugin already has the installed apps for that TV, the application field is a dropdown. Choose **Other** to type an id that is not in the list. See [Applications](/extra/applications.md).

## Settings

### name

**(Required)** The name shown in Home.

- Type: `string`
- Example: `Netflix`

### type

**(Required)** What the input does.

- Type: `string`
- Options: `app`, `command`, `input`, `artmode`

### value

Required for `app`, `command`, and `input`. Not used for `artmode`.

- Type: `string`
- Example: `11101200001`

## Examples

### Application

Opens an installed app. A list of ids is on the [Applications](/extra/applications.md) page.

The plugin can only ask the TV whether one app is in front. Five application inputs mean five requests. Add the apps you actually switch to.

A command input does not stay selected. Application, source, and Art Mode inputs do, while that app, source, or Art Mode is active.

```json
{
  "name": "Bedroom TV",
  "ip": "10.20.30.40",
  "mac": "A0:B1:C2:D3:E4:F5",
  "inputs": [{ "name": "Netflix", "type": "app", "value": "11101200001" }]
}
```

### Command

Sends one or more remote keys. The list is on the [Commands](/extra/commands.md) page. Separate keys with a comma, or pass a list. Home clears the selection right after the command runs, because a command is not a source.

```json
{
  "name": "Bedroom TV",
  "ip": "10.20.30.40",
  "mac": "A0:B1:C2:D3:E4:F5",
  "inputs": [
    { "name": "Source", "type": "command", "value": "KEY_SOURCE" },
    {
      "name": "Source and enter",
      "type": "command",
      "value": "KEY_SOURCE,KEY_ENTER"
    }
  ]
}
```

### Source

::: warning
This type needs [SmartThings](/configuration/smartthings-api.md) on the platform and a `deviceId` on the TV.
:::

Selects a specific source. Digital TV is `dtv`. If an older config still says `digitalTv`, open the input and save it again as Digital TV. Until you do, Home will not show it as the active source.

Values: `dtv`, `HDMI1`, `HDMI2`, `HDMI3`, `HDMI4`, `HDMI5`, `HDMI6`, `USB`, `USB-C`, `Display Port`.

When SmartThings is connected, the settings screen lists the sources that TV actually reports. The ids above are the fallback list.

```json
{
  "name": "Bedroom TV",
  "ip": "10.20.30.40",
  "mac": "A0:B1:C2:D3:E4:F5",
  "deviceId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "inputs": [
    { "name": "Live TV", "type": "input", "value": "dtv" },
    { "name": "Xbox", "type": "input", "value": "HDMI1" }
  ]
}
```

### Art Mode

On a Frame, this input turns Art Mode on and shows as the active input while Art Mode is on. `value` is not used. The type is `artmode`. Details are on the [Frame TVs](/configuration/frame-tvs.md#art-mode-input) page.

```json
{
  "inputs": [{ "name": "Art Mode", "type": "artmode" }]
}
```
