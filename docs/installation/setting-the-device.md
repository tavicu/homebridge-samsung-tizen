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

This is the screen where you manage the plugin. **Devices** is the list of TVs. **Inputs**, **Switches**, and **Remote Keys** are the shared settings, used by every TV. The card at the top is the SmartThings connection. You can add and control a TV without it. Connect it when you want the extra features that depend on SmartThings.

### Add a TV

The first step is to add a new device on the **Devices** tab. This form only asks for the essential details: **Device Name**, **IP Address**, and **MAC Address**. After you add it, you are taken to the device edit page, where you can configure all of its options. Those options are described in the [configuration](/configuration/) section.

Enter the IP, then click **Test** to make a quick check.

- **Connection established** means the TV answered. If the MAC field is empty, it is filled in automatically.
- **TV not supported** means the TV answered, but this plugin does not support it.
- **Unable to connect** means the IP is wrong, the TV is off, or Homebridge cannot reach it.

## Manual configuration

You can edit the config from the `Config` tab in Homebridge UI, or open `config.json` from a terminal. The usual path is `~/.homebridge/config.json`. If yours is somewhere else, see the [Homebridge wiki](https://github.com/homebridge/homebridge/wiki).

This is just an example with a basic configuration. For more detailed examples, see the [configuration page](/configuration/index.md).

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
