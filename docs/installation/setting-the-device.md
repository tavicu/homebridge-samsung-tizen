# Setting the device

After you install the plugin, add each TV and restart Homebridge so the change is applied.

::: tip Important
Before you add a TV, give it a **static IP address** on your router. The plugin uses that address to reach the TV, so it has to stay the same after the TV or the router restarts. If it changes, the plugin can no longer find the TV until you update the address in the settings.
:::

::: warning Subnet
Samsung TVs do not allow WebSocket connections across subnets or VLANs. The TV has to be on the same subnet as Homebridge.
:::

The settings screen needs Homebridge Config UI X v5.27.0 or newer. Older versions show a short notice and the basic editor instead. You can still enter devices there, or in `config.json`.

## Using Homebridge UI

Open the `Plugins` tab and click `SETTINGS` on **Homebridge Samsung Tizen**.

This is the screen where you manage the plugin:

- The card at the top is the SmartThings connection. You can add and control a TV without it. Connect it when you want the [features that depend on SmartThings](/smartthings/features.md).
- **Devices** is the list of TVs.
- **Inputs**, **Switches** and **Remote Keys** are the global settings, used by every TV.

Changes are saved to the config as soon as you add, update or delete something. A banner then asks you to restart Homebridge, so the plugin picks them up.

::: tip
If the child bridge option is turned on for this plugin, the screen shows a warning. Each TV is already published on its own, so the child bridge is not needed. Turn it off.
:::

### Add a TV

On the **Devices** tab, add a new device. This first form only asks for the essentials:

- **Device Name**, the name shown in Home
- **IP Address**
- **MAC Address**
- **SmartThings Device ID**, optional. See [Pick the TV](/smartthings/index.md#pick-the-tv).

Turn the TV on, enter the IP and click **Test** for a quick check.

- **Connection established** means the TV answered. If the MAC field is empty, it is filled in from the TV.
- **TV not supported** means the TV answered, but this plugin does not support it.
- **Unable to connect** means the IP is wrong, the TV is off, or Homebridge cannot reach it.

The TV's identity in Home is built from its MAC address, so check it before you add the TV. Changing it later makes Home see a new TV.

### Edit a TV

After you add a TV, you are taken to its edit page. It has four tabs:

- **Settings** has the main details, plus the optional `UUID` and the device options. All of them are described on the [Settings](/configuration/device-settings.md) page.
- **Inputs**, **Switches** and **Remote Keys** are for this TV only. They are added on top of the global ones from the dashboard. See [Platform and device settings](/configuration/device-settings.md#platform-and-device-settings).

When the TV has a SmartThings device ID, the input and switch forms on this page load the sources, picture modes and sound modes of that TV. The application field lists the apps installed on the TV, once the TV has reported them.

## Manual configuration

You can edit the config from the `Config` tab in Homebridge UI, or open `config.json` from a terminal. The usual path is `~/.homebridge/config.json`.

This is a basic configuration. For more examples, see the [configuration page](/configuration/index.md).

```json
"platforms": [
    {
        "platform": "SamsungTizen",
        "devices": [
            {
                "name": "Bedroom TV",
                "ip": "192.168.1.100",
                "mac": "C0:A8:49:B3:D3:63"
            }
        ]
    }
]
```
