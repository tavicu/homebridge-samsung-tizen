# Inputs

::: tip
After you add inputs, HomeKit can take a while to attach them to the TV. Force-quit the Home app and open it again. If they are still separate, wait. They attach on their own.
:::

Inputs are the entries in the TV's input list in Home. An input can open an [application](#application), send [commands](#command), select a [source](#source) such as HDMI, or turn on [Art Mode](#art-mode) on a Frame.

Global inputs, set on the **Inputs** tab of the dashboard, are added to every TV. Inputs on a TV's own **Inputs** tab are added on top of them, for that TV only. See [Platform and device settings](/configuration/device-settings.md#platform-and-device-settings).

Home identifies an input by its type and value, not by its name or its position. Renaming an input keeps it the same in Home. Reordering only changes the order in Home. An input with no name is skipped and written to the log.

## Settings

### name

**(Required)** The name shown in Home.

- Type: `string`
- Example: `Netflix`

### type

**(Required)** What the input does.

| Type      | Settings screen | What it does                           |
| :-------- | :-------------- | :------------------------------------- |
| `app`     | Application     | Opens an installed app                 |
| `command` | Command         | Sends one or more remote keys          |
| `input`   | Input           | Selects a source. Needs SmartThings.   |
| `artmode` | Art Mode        | Turns Art Mode on. Only for Frame TVs. |

### value

Required for `app`, `command` and `input`. Not used for `artmode`.

- Type: `string`, or a list of strings for `command`
- Example: `11101200001`

## Active input

Home shows which input is active. Application, source and Art Mode inputs are shown as active while that app, source or Art Mode is on the TV. A command input is never active, because a command is not a source. Home clears the selection right after the command runs.

To find the active input, the plugin checks the inputs one by one and stops at the first match. It starts with the cheapest checks: Art Mode, then the input that was active last time, then sources, then apps. Apps are checked last because each one is a separate request to the TV.

## Examples

### Application

Opens an installed app. Some app ids are on the [Applications](/extra/applications.md) page.

When you add the input from a TV's own **Inputs** tab, the settings screen lists the apps installed on that TV, if the TV has reported them. Choose **Other** to type an id that is not in the list. A global input applies to every TV, so there is no single TV to load the list from, and you type the id.

```json
{
  "name": "Bedroom TV",
  "ip": "10.20.30.40",
  "mac": "A0:B1:C2:D3:E4:F5",
  "inputs": [{ "name": "Netflix", "type": "app", "value": "11101200001" }]
}
```

::: warning Add only the apps you use
We do not recommend adding many applications as inputs. Each one is a separate request to the TV every time Home checks the active input. Twenty application inputs can mean twenty requests, which makes Home slower and puts extra load on the TV.
:::

### Command

Sends one or more remote keys. The list is on the [Commands](/extra/commands.md) page.

`value` is one key as a string, or a list when you send several keys one after the other. In the settings screen each key is a row. You can repeat a key with `KEY_VOLUP*3` and hold it with `KEY_POWER*2.5s`. See [Switches](/features/switches.md#command) for the details.

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
      "value": ["KEY_SOURCE", "KEY_ENTER"]
    }
  ]
}
```

### Source

::: warning
This type needs [SmartThings](/smartthings/index.md) to be connected and a `deviceId` on the TV.
:::

Selects a source such as HDMI or Digital TV. The values, and how the active source is read, are on the [SmartThings features](/smartthings/features.md#input-source) page.

Values: `dtv`, `HDMI1`, `HDMI2`, `HDMI3`, `HDMI4`, `HDMI5`, `HDMI6`, `USB`, `USB-C`, `Display Port`.

When you add the input from a TV's own **Inputs** tab, the settings screen lists the sources that TV reports.

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

On a Frame, this input turns Art Mode on. It is shown as the active input while Art Mode is on. `value` is not used. Details are on the [Frame TVs](/configuration/frame-tvs.md#art-mode-input) page.

```json
{
  "inputs": [{ "name": "Art Mode", "type": "artmode" }]
}
```
