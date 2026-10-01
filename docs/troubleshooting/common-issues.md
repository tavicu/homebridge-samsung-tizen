---
sidebarDepth: 0
---

# Common issues

## TV turns on, but no other command works

Turning the TV on uses Wake on LAN, which works even when the Samsung API does not. Everything else needs a compatible TV and an allowed pairing.

Confirm the TV is [compatible](/installation/index.md#check-compatibility) and that you did not choose **Deny** on the pairing prompt. On the TV open `Settings` → `General` → `External Device Manager` → `Device Connection Manager` → `Device List` and allow the plugin, or delete the entry and restart Homebridge.

The TV and Homebridge also have to be on the same subnet. Across a VLAN, Wake on LAN may still turn the TV on while commands fail.

## The pairing prompt is not shown

The TV may be [incompatible](/installation/index.md#check-compatibility), or a previous **Deny** is still stored. See [Clicked Deny by mistake](/installation/pairing-the-device.md#clicked-deny-by-mistake). If that does not help, [open an issue](/troubleshooting/open-new-issue.md) with debug logs.

## TV keeps asking for permission

**Allow** returns a token that is saved in `samsung-tizen.json` (usually `~/.homebridge/accessories/samsung-tizen.json`). If Homebridge cannot write that file, the prompt comes back every start. In debug mode the log includes the storage for that TV, and it should contain the token.

```bash
[3/2/2023, 3:55:10 PM] [Bedroom TV] [DEBUG] Device storage: {"token":"77050680","tokenSupport":true,"frameSupport":false}
```

On the TV, open `Settings` → `General` → `External Device Manager` → `Device Connection Manager` and set **Access Notification** to `Off`.

## TV is not supported

**Test connection** says **TV not supported**, or the log warns at startup, when the TV is not compatible. The plugin supports Tizen TVs from 2017 onward. Older TVs that pair with a PIN are not supported.

## Inputs appear as separate accessories

HomeKit sometimes takes a while to attach new inputs to the TV. Force-quit the Home app and open it again. If they are still separate, wait.

## The TV does not appear when I try to add it in Home

Each TV has an id built from its MAC address. If the TV was removed in Home but is still known to Homebridge, Home will not offer it again.

Set `uuid` to any short string. The id becomes the MAC plus that string. Restart Homebridge and add the TV again.

```json
{
  "name": "Bedroom TV",
  "ip": "10.20.30.40",
  "mac": "A0:B1:C2:D3:E4:F5",
  "uuid": "a1"
}
```

## Add buttons to the Apple TV remote

The plugin cannot choose which buttons the Control Center remote shows. It can only choose the command each button sends. See [Keys](/features/keys.md).

## Hide a TV from the Apple TV remote

There is no setting for that. Home adds every TV accessory to that remote.

## I added the main bridge and the TVs are missing

TVs are external accessories. Each one has its own bridge, and that bridge has to be [added in Home](/installation/adding-to-home-app.md). Do not enable a child bridge for this plugin. If one is already on, turn it off.

## I do not want SmartThings

That is fine. Power, volume, mute, apps, and remote keys work without it. You will not be able to select an HDMI source, a picture mode, or a sound mode, and a full power off on a newer Frame may not work. See [SmartThings](/configuration/smartthings-api.md).

## SmartThings returns 401 or the wizard fails

The authorization code may be wrong, expired, or already used. Run **Connect to SmartThings** again and paste a fresh code from the token page.

Also check that the SmartThings app was created as **OAuth-In App**, that the redirect URI is `https://tavicu.github.io/homebridge-samsung-tizen/token.html`, and that the scopes are `r:devices:*` and `x:devices:*`. A personal access token from an older setup is not used. See [SmartThings](/configuration/smartthings-api.md).

## SmartThings returns 403

The app is missing `r:devices:*` or `x:devices:*`, or the `deviceId` on the TV is not a device on that account. Edit the TV and pick the device again after SmartThings shows **Connected**.

## Digital TV or Art Mode never shows as the active input

An older Digital TV input used `digitalTv`. The id is now `dtv`. Open the input or switch and save it again.

An Art Mode input used `type: art`. The type is now `artmode`. See [Upgrading from version 5](/extra/upgrading.md).

## Frame tile does not turn the TV fully off

By default the tile follows Art Mode. OFF means Art Mode, not standby. A full power off uses the Power switch, or `Frame.RealPowerMode` on the tile, and it needs SmartThings on newer Frames. See [Frame TVs](/configuration/frame-tvs.md).

## The new settings screen does not load

The interactive screen needs Homebridge Config UI X v5.27.0 or newer. Older versions show a notice and the basic editor. You can still edit `config.json`. See [Setting the device](/installation/setting-the-device.md).

## Devices use a different port after a restart

Homebridge chooses the port for each external accessory. To keep them in a range, set `ports` on the bridge:

```json
{
  "bridge": {},
  "ports": {
    "start": 51510,
    "end": 51550
  },
  "platforms": []
}
```

## Homebridge shows a speaker that Home does not

The speaker service is how the Control Center remote sets the volume. Homebridge UI lists it. The Home app does not show it as a tile. See [Volume](/features/volume.md).
