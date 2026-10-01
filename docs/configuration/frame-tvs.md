# Frame TVs

A Frame is detected automatically when the plugin pairs with the TV. You do not set this yourself. The Art Mode and Power switches appear once the TV is paired.

Samsung does not allow a full power off through the local API. When SmartThings is connected and the TV has a `deviceId`, turning the Frame fully off uses SmartThings. Without it, the plugin holds the power key. Newer Frames only switch Art Mode on that hold, so a full power off may not work until SmartThings is set up. See [SmartThings features](/smartthings/features.md#frame-power-off).

## Default tile

By default the Home tile follows Art Mode. It does not cut power.

- The tile is **ON** while you are watching TV (Art Mode off, and the TV has power).
- The tile is **OFF** while Art Mode is on, and also while the TV is fully off.
- Turning the tile **OFF** switches Art Mode on. It does not turn the panel off.
- Turning the tile **ON** switches Art Mode off. If the TV is fully off, it is turned on first.

## Art Mode and Power switches

A Frame gets two switches on the TV accessory, named `{TV name} Art Mode` and `{TV name} Power`. With `Switch.DeviceName.Disable` they are named only `Art Mode` and `Power`.

- **Art Mode** turns Art Mode on and off. It shows ON only when Art Mode is on and the TV has power. If the TV is fully off, turning the switch on powers the TV first, then sets Art Mode.
- **Power** turns the TV fully on and off, including while Art Mode is on. ON means the TV has power. OFF cuts power, using SmartThings when it is connected.

Hide either switch with `Frame.ArtSwitch.Disable` or `Frame.PowerSwitch.Disable`.

## Real power on the tile

`Frame.RealPowerMode` makes the tile follow power instead of Art Mode.

- **ON** means the TV has power, including while Art Mode is on.
- **OFF** cuts power. This needs SmartThings (authorization and a `deviceId`). Without SmartThings the plugin holds the power key for about 3.5 seconds, which newer Frames no longer honor.

```json
{
  "name": "Frame TV",
  "ip": "10.20.30.40",
  "mac": "A0:B1:C2:D3:E4:F5",
  "options": ["Frame.RealPowerMode"]
}
```

To hide both extra switches and use only the tile as a power control:

```json
{
  "name": "Frame TV",
  "ip": "10.20.30.40",
  "mac": "A0:B1:C2:D3:E4:F5",
  "deviceId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "options": [
    "Frame.RealPowerMode",
    "Frame.ArtSwitch.Disable",
    "Frame.PowerSwitch.Disable"
  ]
}
```

## Art Mode input

You can add an input that turns Art Mode on. In Home it shows as the active input while Art Mode is on, and it updates as soon as Art Mode changes on the TV. While the TV is on, Art Mode is also checked on the same 15 second interval used for custom switches. The plugin does not ask the TV when Home only reads the tile, and it skips Frame requests while the TV is off.

The type is `artmode`. No `value` is required.

```json
{
  "name": "Frame TV",
  "ip": "10.20.30.40",
  "mac": "A0:B1:C2:D3:E4:F5",
  "inputs": [{ "name": "Art Mode", "type": "artmode" }]
}
```
