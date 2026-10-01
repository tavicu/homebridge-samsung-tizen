# Getting started

## Check compatibility

The plugin supports Samsung TVs with Tizen OS from 2017 onward that use token authentication. TVs from 2016 and earlier use a PIN pairing method, which this plugin does not support.

Make sure the TV is turned on, then open `http://TV_IP:8001/api/v2/` from a device on the same network and replace `TV_IP` with the TV address. A compatible TV returns information about the device as JSON. If there is no response, the TV is not supported.

## Network

Give every TV a **static IP address** on your router. The plugin uses that address to reach the TV, so it has to stay the same after the TV or the router restarts. If it changes, the plugin can no longer find the TV until you update the address in the settings.

The TV and Homebridge must be on the **same subnet**. Samsung blocks the WebSocket connection across VLANs, so a TV on another VLAN will not pair or accept commands. Wake on LAN can still turn the TV on in that case, which is why power-on sometimes works when nothing else does.

## Requirements

- **Node.js:** `22.10+`, `24`, or `26`
- **[Homebridge](https://github.com/homebridge/homebridge):** `1.8+` (Homebridge 2.0 recommended)
- **[Homebridge Config UI X](https://github.com/homebridge/homebridge-config-ui-x):** `v5.27.0+` (required for the new interactive configuration interface)

## Homebridge

This plugin runs on Homebridge, so you need a Homebridge server on your network.

Homebridge is a lightweight server that emulates the iOS HomeKit API. It lets you control devices that are not compatible with HomeKit.

You can follow the steps from the [Homebridge documentation](https://github.com/homebridge/homebridge/blob/master/README.md) on how to install and run the server and also learn more regarding Homebridge.
