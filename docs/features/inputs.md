# Inputs

::: tip
Sometimes when you add inputs it takes some time for HomeKit to link them to TV. You can try restarting the Home app on your phone, some suggested this will fix the problem. If it's still not working after that just wait, it will link after some time.
:::

Since iOS 12 Apple allows us to add inputs for TVs.

There are multiple types of inputs. With the basic configuration you can open [applications](#application-type) or send [commands](#command-type) to TV.

If you also have [SmartThing API](/configuration/smartthings-api.md) configured you can select specific inputs like `HDMI1`.

## Settings

### name

**(Required)** The name of the input to be used in Home app.

- Type: `string`
- Example: `Netflix`

### type

**(Required)** The type of the input.

- Type: `string`
- Example: `app`
- Options: [`app`](#application-type) / [`command`](#command-type) / [`input`](#input-type) / [`art`](#art-type)

### value

**(Required)** The value of the input. Depending on what type the input is it can be an application id or a command.

- Type: `string`
- Example: `11101200001`

## Examples

### Application type

This option allow you to select an application. You can find a list with applications on the [Applications page](/extra/applications.md).

::: tip
At the moment Samsung don't have an API to tell us what application is active. But there is an API which we can access that tells us the status of a specific application. That means if you have 5 inputs of this type there will be made 5 requests to the TV in order to check the status of each application.

That's why I don't recommend creating unnecessary inputs of this type because it will flood your TV with requests until the point that it will not respond to anything. Create only the inputs that you are using most often.
:::

``` json
{
    "name": "Bedroom TV",
    "ip": "10.20.30.40",
    "mac": "A0:B1:C2:D3:E4:F5",
    "inputs": [
        {"name": "Netflix", "type": "app", "value": "11101200001"}
    ]
}
```

### Command type

This option will allows you to send a command or a list of commands to your TV. These commands represents buttons from phisical remotes. You can find a list with known commands on the [Commands page](/extra/commands.md).

``` json
{
    "name": "Bedroom TV",
    "ip": "10.20.30.40",
    "mac": "A0:B1:C2:D3:E4:F5",
    "inputs": [
        {"name": "Simple command", "type": "command", "value": "KEY_SOURCE"},
        {"name": "List commands", "type": "command", "value": "KEY_SOURCE,KEY_ENTER"}
    ]
}
```

### Input type

::: warning
In order to use this type of input you must have [SmartThings API](/configuration/smartthings-api.md) configured.
:::

This will allows you to select a specific input source like `HDMI1`.

Possible `values` for this input type: `digitalTv`, `USB`, `HDMI1`, `HDMI2`, `HDMI3`, `HDMI4`, `HDMI5`, `HDMI6`

``` json
{
    "name": "Bedroom TV",
    "ip": "10.20.30.40",
    "mac": "A0:B1:C2:D3:E4:F5",
    "inputs": [
        {"name": "Live TV", "type": "input", "value": "digitalTv"},
        {"name": "My Xbox", "type": "input", "value": "HDMI1"}
    ]
}
```

### Art type

If you have a Frame TV there is an option to create an input for Art Mode. For this type the `value` key is not required.

You can read more regarding this type and see example of how to use it on the [Frame TVs page](/configuration/frame-tvs.md#art-input).
