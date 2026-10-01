# Volume

Volume and mute are read from the TV over the local network, as soon as they change. They follow the physical remote, and they do not need SmartThings.

## Remote in Control Center

The TV has a speaker that Home uses for the remote in Control Center. While the remote is open, the volume buttons on the iPhone send `KEY_VOLUP` and `KEY_VOLDOWN` to the TV. The buttons stay enabled while the TV is on.

Homebridge UI lists that speaker under Accessories, named `{TV name} Volume`. The Home app does not show it as a tile. It exists only for the remote.

## Set a volume level

The plugin sets the volume from 0 to 100 on the TV's local API. You can use it in two ways:

- a [custom switch](/features/switches.md#volume) with `volume`, which sets one level and turns off after it runs
- the [volume slider](#volume-slider), which always shows the current volume and can be used in scenes and automations

## Volume slider

`Volume.Slider.Enable` on the TV adds a light named `{TV name} Volume`. Home shows it as a light because that is the accessory type with a 0 to 100 slider you can use in scenes and automations.

- **Brightness** is the volume, from 0 to 100.
- **On** means the TV is on and not muted.
- Turning the light **off** mutes the TV. Turning it **on** unmutes it.
- While the TV is off, the slider stays off. A change is ignored until the TV is on.

::: warning
Because it is a light, turning off all the lights in a room or in the home, from the Home app or with Siri, also mutes the TV. Turning them on unmutes it.
:::

```json
{
  "name": "Bedroom TV",
  "ip": "10.20.30.40",
  "mac": "A0:B1:C2:D3:E4:F5",
  "options": ["Volume.Slider.Enable"]
}
```

In the settings screen this option is **Create a slider that controls the TV volume**, at the bottom of the TV settings.

## If the volume does not update

To send volume and mute changes, the TV connects back to Homebridge. If the TV cannot reach it, commands still work, but Home shows an old volume and mute state.

- If Homebridge runs in Docker, use host networking (`network_mode: host`).
- A firewall on the Homebridge server must allow incoming connections from the TV.
- The TV and Homebridge have to be on the same subnet.
