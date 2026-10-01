# Keys

::: warning
This does not add buttons in Home. It only chooses which TV key runs when you press a button on the Apple TV remote in Control Center. Apple decides which buttons are on that remote.
:::

Open Control Center by swiping down from the upper-right corner. If the remote icon is missing, add it in `Settings` → `Control Center`.

The volume buttons on the phone change the TV volume while that remote is open. See [Volume](/features/volume.md).

![Apple TV remote](/images/features.keys.jpg)

## Default mapping

Every button already has a command. Add a key to the config only when you want a different one. Leave a field empty in the settings screen to keep the default.

The command list is on the [Commands](/extra/commands.md) page.

| Button       | Command       |
| :----------- | :------------ |
| ARROW_UP     | KEY_UP        |
| ARROW_DOWN   | KEY_DOWN      |
| ARROW_LEFT   | KEY_LEFT      |
| ARROW_RIGHT  | KEY_RIGHT     |
| SELECT       | KEY_ENTER     |
| BACK         | KEY_RETURN    |
| EXIT         | KEY_RETURN    |
| PLAY_PAUSE   | KEY_PLAY_BACK |
| REWIND       | KEY_REWIND    |
| FAST_FORWARD | KEY_FF        |
| INFORMATION  | KEY_INFO      |

## Changing a button

Keys on the plugin **Remote Keys** tab apply to every TV. Keys on a TV override the same button for that TV only. A mapping does not leak from one TV to another.

```json
{
  "name": "Bedroom TV",
  "ip": "10.20.30.40",
  "mac": "A0:B1:C2:D3:E4:F5",
  "keys": {
    "SELECT": "KEY_INFO"
  }
}
```
