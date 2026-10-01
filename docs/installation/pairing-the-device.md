# Pairing the device

After you add a TV, restart Homebridge. The plugin connects to the TV and the TV asks for permission. When you allow it, the TV gives the plugin a token. The plugin saves it and uses it on every later connection, so you only allow it once.

When the prompt appears on the TV, choose **Allow**.

![Pairing prompt on the TV](/images/install.pairing-device.jpg)

The TV has to be on for the prompt to appear. If it is off when Homebridge starts, the log says `Waiting for the TV to turn on to pair...`. Turn the TV on and the prompt appears. You do not have to restart Homebridge.

If the TV does not answer in time, the plugin tries again a few times. If it still fails, the log says `Pairing failed, it will be retried the next time the TV turns on`. Turn the TV off and on again to get a new prompt.

With debug mode on, a successful pairing writes `Device paired with success` in the log.

## Clicked Deny by mistake

**Deny** is remembered by the TV, and later connections are rejected. The log then says `TV rejected the WebSocket connection (unauthorized)`.

On the TV open `Settings` → `General` → `External Device Manager` → `Device Connection Manager` → `Device List`. On newer TVs the menu is `General & Privacy` instead of `General`. Look for **Homebridge** in the list, and either change it to Allow or delete the entry. If you delete it, the prompt appears again the next time the TV turns on.

## Frame TVs

A Frame is detected during pairing. Its Art Mode and Power switches appear once the TV is paired. See [Frame TVs](/configuration/frame-tvs.md).
