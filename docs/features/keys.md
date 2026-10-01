# Keys

Every TV you add in Home also shows up in the Apple TV Remote on your iPhone and iPad. You can use it like the physical remote of the TV: move through menus, select, go back, play and pause.

Keys decide which TV command each button of that remote sends. Every button already has a default, so you only change a key when you want a button to do something else.

::: warning
This does not add buttons to the remote. Apple decides which buttons it shows. The plugin only chooses the command each button sends.
:::

## Open the remote

Open Control Center by swiping down from the upper-right corner and tap the remote icon. Choose the TV at the top of the remote.

If the remote icon is missing, add it to Control Center. On iOS 18 and newer, touch and hold an empty area of Control Center, tap **Add a Control** and pick **Apple TV Remote**. On older versions, add it in `Settings` → `Control Center`.

While the remote is open, the volume buttons of the iPhone change the TV volume. See [Volume](/features/volume.md).

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

Global keys, set on the **Remote Keys** tab of the dashboard, apply to every TV. Keys on a TV's own **Remote Keys** tab replace the same button for that TV only. The other buttons keep the global value, or the default. A mapping on one TV never changes another TV.

In the settings screen, an empty field shows the value it falls back to as a placeholder.

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
