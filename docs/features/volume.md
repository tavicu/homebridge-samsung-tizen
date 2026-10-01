# Volume

Volume and mute are read from the TV over the local network. They follow the physical remote, and they do not need SmartThings.

The speaker service uses the same on/off state as the TV. While the TV is on, the volume buttons in the iOS remote stay enabled. Homebridge UI lists that speaker under Accessories. The Home app does not show it as its own tile. It exists so the remote can set the volume.

A volume or mute event is applied only when it comes from the subscription opened for that TV. If an event arrives without a volume or mute value, the last value is kept.

## Absolute volume

The remote sets the volume from 0 to 100, not only up and down. Step up and step down still send `KEY_VOLUP` and `KEY_VOLDOWN`.

A [custom switch](/features/switches.md#volume) can set a level too. That switch turns off after it runs. It does not stay on at that level.

## Volume slider

`Volume.Slider.Enable` on the TV adds a light bulb named `{TV name} Volume`. Home shows it as a light because that is the accessory type that has a 0–100 slider you can use in scenes and automations.

- **Brightness** is the volume, from 0 to 100.
- **On** means the TV is on and not muted.
- Turning the light **off** mutes the TV. Turning it **on** unmutes it.
- While the TV is off, the slider stays off. A change is ignored until the TV is on.

```json
{
  "name": "Bedroom TV",
  "ip": "10.20.30.40",
  "mac": "A0:B1:C2:D3:E4:F5",
  "options": ["Volume.Slider.Enable"]
}
```

In the settings screen this option is **Create a slider that controls the TV volume**.
