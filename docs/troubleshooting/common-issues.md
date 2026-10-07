# Common issues

## Pairing and connection

### TV turns on, but no other command works

Turning the TV on uses Wake on LAN, which works even when the Samsung API does not. Everything else needs a compatible TV, an allowed pairing, and a network where Homebridge can reach the TV.

- Confirm the TV is [compatible](/installation/index.md#check-compatibility).
- Check that you did not choose **Deny** on the pairing prompt. See [Clicked Deny by mistake](/installation/pairing-the-device.md#clicked-deny-by-mistake).
- The TV and Homebridge have to be on the same subnet. Across a VLAN, Wake on LAN may still turn the TV on while commands fail.
- Guest networks and wireless client isolation (AP isolation) block the connection. Turn them off for the network the TV uses.
- If Homebridge runs in Docker, use host networking.

**Test** in the settings screen only checks the basic API of the TV. It can pass while the connection used for commands is still blocked.

### The pairing prompt is not shown

- The TV has to be on. If the log says `Waiting for the TV to turn on to pair...`, turn the TV on.
- The TV may be [incompatible](/installation/index.md#check-compatibility).
- A previous **Deny** may still be stored. See [Clicked Deny by mistake](/installation/pairing-the-device.md#clicked-deny-by-mistake).

If none of that helps, [open an issue](/troubleshooting/open-new-issue.md) with debug logs.

### TV keeps asking for permission

**Allow** returns a token that is saved in `samsung-tizen.json` (usually `~/.homebridge/accessories/samsung-tizen.json`). If Homebridge cannot write that file, the prompt comes back every start. In debug mode the log shows the storage for that TV after pairing, and it should contain the token.

```bash
[homebridge-samsung-tizen] [Bedroom TV] Device storage: {"token":"77050680","firmware":"2.0.25","model":"QE55Q80TATXXH","frameSupport":false,"tokenSupport":true,"powerStateSupport":true}
```

On the TV, open `Settings` → `General` → `External Device Manager` → `Device Connection Manager` and set **Access Notification** to `Off`. On newer TVs the menu is `General & Privacy` instead of `General`.

### TV is not supported

**Test** in the settings screen says **TV not supported**, or the log says `The TV ... is not supported by this plugin!`. The TV answered, but this plugin cannot control it. The plugin supports Tizen TVs from 2017 onward. Older TVs that pair with a PIN are not supported.

## Home app

### I added the main bridge and the TVs are missing

TVs are external accessories. Each one is published on its own, and has to be [added in Home](/installation/adding-to-home-app.md) separately. The child bridge option is not needed for this plugin. If it is on, turn it off.

### The TV does not appear when I try to add it in Home

Each TV has an identity built from its MAC address. If the TV was removed from Home but is still known to Homebridge, Home will not offer it again.

Set `uuid` to any short string. The identity becomes the MAC plus that string. Restart Homebridge and add the TV again.

```json
{
  "name": "Bedroom TV",
  "ip": "10.20.30.40",
  "mac": "A0:B1:C2:D3:E4:F5",
  "uuid": "a1"
}
```

### Inputs appear as separate accessories

HomeKit sometimes takes a while to attach new inputs to the TV. Force-quit the Home app and open it again. If they are still separate, wait.

### The TV shows on or off with a delay

The TV announces itself on the network when it turns on and off, and the plugin listens for those announcements. If your network filters multicast traffic between the TV and Homebridge, the plugin falls back to checking the TV on its own. The state is still updated, but it can take up to a minute.

### Volume and mute do not follow the TV

The TV connects back to Homebridge to send volume and mute changes. Commands still work if it cannot, but Home keeps an old value. See [If the volume does not update](/features/volume.md#if-the-volume-does-not-update).

### Devices use a different port after a restart

Homebridge chooses the port for each external accessory. To keep them in a range, set `ports` in the Homebridge config:

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

### Homebridge shows a speaker that Home does not

The speaker is how the Control Center remote sets the volume. Homebridge UI lists it. The Home app does not show it as a tile. See [Volume](/features/volume.md).

## Remote

### Add buttons to the Apple TV remote

The plugin cannot choose which buttons the Control Center remote shows. It can only choose the command each button sends. See [Keys](/features/keys.md).

### Hide a TV from the Apple TV remote

There is no setting for that. Home adds every TV accessory to that remote.

## Inputs and switches

### My inputs or switches are missing from the settings screen

Inputs and switches can be global or set on a TV. The **Inputs** and **Switches** tabs on the dashboard only list the global ones. The ones set on a TV are listed when you edit that TV.

### A switch turns back off and the log says the TV is off

`Switch "..." was turned back off because the TV is off.` The switch was used while the TV was off, and it does not turn the TV on. Turn on **Power on TV before running actions** for that switch if it should wake the TV. See [power](/features/switches.md#power).

### A switch turns off right after I turn it on

Switches with only power, volume or commands have no state to read, so they turn off after they run. A channel switch without SmartThings turns off at the next check, because the plugin cannot read the channel. See [The state in Home](/features/switches.md#the-state-in-home).

### Digital TV or Art Mode never shows as the active input

Digital TV is detected only through SmartThings, and only while SmartThings reports a channel. Check that SmartThings is connected and that the TV has a `deviceId`.

Art Mode inputs work only on a Frame.

## SmartThings

### I do not want SmartThings

That is fine. Power, volume, mute, apps, remote keys and Art Mode work without it. You will not be able to select a source such as HDMI, a picture mode or a sound mode, and a full power off on a newer Frame may not work. See [SmartThings features](/smartthings/features.md).

### SmartThings features do not work

- The SmartThings card in the settings screen has to show **Connected**.
- The TV needs a `deviceId`. See [Pick the TV](/smartthings/index.md#pick-the-tv).
- Restart Homebridge after the first connection.
- The TV has to be online in the SmartThings app, and you can control it from there.

### The log says invalid device state

SmartThings returns `invalid device state` for any command sent to a TV that is no longer online in your SmartThings account. This usually happens after the SmartThings app on your phone is left unused for a long time.

Open the SmartThings app and check the TV. The app may tell you it has not been used for a while, and the TV may show as offline or with the cloud icon turned off.

Remove the TV from the SmartThings app and add it again. SmartThings commands should work again after that.

### The wizard fails, or SmartThings returns 401 or 403

See [Troubleshooting](/smartthings/index.md#troubleshooting) on the SmartThings integration page.

### The card shows Expired

The token could not be refreshed. Choose **Re-authorize SmartThings** and go through the wizard again. See [Connection status](/smartthings/index.md#connection-status).

## Frame TVs

### Frame tile does not turn the TV fully off

By default the tile follows Art Mode. OFF means Art Mode, not standby. A full power off uses the Power switch, or `Frame.RealPowerMode` on the tile, and it needs SmartThings on newer Frames. See [Frame TVs](/configuration/frame-tvs.md).

### Art Mode does not change or does not update

Sometimes a Frame stops answering Art Mode requests, while everything else still works. Home then keeps showing an old Art Mode state, and turning Art Mode on or off from Home does nothing. This is a problem on the TV, and restarting Homebridge does not fix it.

Restart the TV:

- **Hard restart.** Hold the power button on the TV remote until the Samsung logo appears.
- **Better, unplug it.** Unplug the TV from power for 2 to 3 minutes, then plug it back in.

After the restart, Art Mode should work again.

## Settings screen

### The new settings screen does not load

The settings screen needs Homebridge Config UI X v5.27.0 or newer. Older versions show a notice and the basic editor. You can still edit `config.json`. See [Setting the device](/installation/setting-the-device.md).

### The log warns about v5 settings

After an upgrade from version 5, the log lists every old setting still in your config, and what to change. The old values keep working for now. See [Upgrading from version 5](/extra/upgrading.md).
