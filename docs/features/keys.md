# Keys

::: warning
This feature will not create any accessories or button in Home app. Keys are designed for Apple TV Remote that is found in Control Center.

**Unfortunately at the moment Apple don't allow us to change what buttons are shown on the screen, we can only program what the buttons to do when they are pressed.**
:::

To access Apple TV Remote open the Control Center by swiping down from the upper-right corner of the screen.

If you don't have the icon on the Control Center it can be activated by going into `Settings` -> `Control Center`.

From here you can also change the speaker volume of TV by pressing the phisical volume buttons on your phone / tablet.

![Features Keys](~@images/features.keys.jpg)

## Default mapping

By default the buttons are already programmed to default commands like in the table below and you don't need to add them to config file unless you want to change something.

You can find a list with known commands on the [Commands page](/extra/commands.md).

| Button      | Command       |
| :---------- | :------------ |
| ARROW_UP    | KEY_UP        |
| ARROW_DOWN  | KEY_DOWN      |
| ARROW_LEFT  | KEY_LEFT      |
| ARROW_RIGHT | KEY_RIGHT     |
| SELECT      | KEY_ENTER     |
| BACK        | KEY_RETURN    |
| PLAY_PAUSE  | KEY_PLAY_BACK |
| INFORMATION | KEY_INFO      |

## Changing default keys

If you want you can change what a button will do when it's pressed.

``` json
{
    "name": "Bedroom TV",
    "ip": "10.20.30.40",
    "mac": "A0:B1:C2:D3:E4:F5",
    "keys": {
        "SELECT": "KEY_INFO"
    }
}
```
