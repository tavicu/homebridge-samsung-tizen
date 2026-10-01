# Getting started

## Check compatibility

The plugin supports Samsung TVs with Tizen OS from 2017 onward that use token authentication. TVs from 2016 and earlier use a PIN pairing method, which this plugin does not support.

Turn the TV on, then open `http://TV_IP:8001/api/v2/` in a browser on the same network, with `TV_IP` replaced by the TV address. A compatible TV returns information about the device as JSON. If there is no response, the TV is not supported.

You can also skip this and let the plugin check for you. When you add a TV in the settings screen, the **Test** button next to the IP address checks that the TV can be reached and that the plugin supports it. If the MAC address field is empty, it also fills it in from the TV. See [Add a TV](/installation/setting-the-device.md#add-a-tv).

## Network

Give every TV a **static IP address** on your router. The plugin uses that address to reach the TV, so it has to stay the same after the TV or the router restarts. If it changes, the plugin can no longer find the TV until you update the address in the settings.

The TV and Homebridge must be on the **same subnet**. Samsung blocks the WebSocket connection across VLANs, so a TV on another VLAN will not pair or accept commands. Wake on LAN can still turn the TV on in that case, which is why power-on sometimes works when nothing else does.

The TV also connects back to Homebridge to send volume and mute changes. If Homebridge runs in Docker, use host networking.

Guest networks and wireless client isolation (also called AP isolation) block the TV and Homebridge from talking to each other. Keep them off for the network the TV uses.

## Requirements

- **Node.js:** `22.10+`, `24`, or `26`
- **[Homebridge](https://github.com/homebridge/homebridge):** `1.8+` (Homebridge 2.0 recommended)
- **[Homebridge Config UI X](https://github.com/homebridge/homebridge-config-ui-x):** `v5.27.0+` (required for the interactive configuration interface of the plugin)

## Homebridge

This plugin runs on Homebridge, so you need a Homebridge server on your network.

Homebridge is a lightweight server that emulates the iOS HomeKit API. It lets you control devices that are not compatible with HomeKit.

Follow the [Homebridge documentation](https://github.com/homebridge/homebridge/wiki) to install and run the server.

## SmartThings

SmartThings is optional. You can install the plugin and control the TV without it, and connect it later. See [SmartThings integration](/smartthings/index.md).
