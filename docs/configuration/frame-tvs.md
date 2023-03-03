---
sidebarDepth: 0
---

# Frame TVs

::: danger Users with Frame TVs from 2022 (Tizen 6.5) or newer
Samsung decided to remove the API for Art Mode from newer TVs. Unfortunately they didn't offer an alternative yet. Only TVs from 2022 or newer are affected, TVs running Tizen 6.5 OS or newer.

When Samsung will decide to add an API in SmartThings we will implement it. Unfortunately until then our only option is to control the Real Power of TV.

For the moment this is not done automatically. So you will have to set the config manually. You can also create a custom switch which will send the `KEY_POWER` command just like you have on physical remote. In the end the main accessory will turn off your TV complety and the custom switch will toggle Art Mode.

``` json
{
    "name": "Frame TV",
    "ip": "192.168.1.1",
    "mac": "D0:C2:4E:A6:4B:7D",
    "options": [
        "Frame.RealPowerMode",
        "Frame.ArtSwitch.Disable",
        "Frame.PowerSwitch.Disable"
    ],
    "switches": [
        {"name": "Art Mode", "command": "KEY_POWER"}
    ]
}
```

:::

***

The plugin detects if a TV is Frame by looking at `FrameTVSupport` key from the `/api/v2/` request to be **true**. The request is made every time the Homebridge server starts if the TV is powered on. If the request responds with success it will update the storage file where all informations regarding the TV are saved.

If the plugin detects that the TV is a Frame it will change it's default behaivor for the main accessory and add new features.

## How the plugin works as default when detects a TV is a Frame

- Main accessory
  - As action, the accessory will control the Art Mode ON/OFF
  - It will display as OFF when the TV is in Art Mode or when the real power is OFF (ArtMode = ON or RealPower = OFF)
  - It will display as ON when the TV has Art Mode OFF and real power ON (ArtMode = OFF and RealPower = ON)
  - When it's OFF, first it will turn on the TV then it will switch Art Mode OFF
- Art Mode Switch
  - This switch will be created by default and you have the option to disable it with `Frame.ArtSwitch.Disable`
  - It will control the Art Mode status
  - It will display as OFF when Art Mode is not active or when the real power is OFF (ArtMode = OFF or RealPower = OFF)
  - It will display as ON when the TV is in Art Mode and real power is ON (ArtMode = ON and RealPower = ON)
  - When the TV real power it's off and you turn the switch ON/OFF, first it will turn the TV ON then it will set the ArtMode to selected value
- Power Switch
  - This switch will be created by default and you have the option to disable it with `Frame.PowerSwitch.Disable`
  - It will control the Real Power of TV
  - It will display as OFF when the real power is OFF, not responding to ping or having powerstate to standby (RealPower = OFF)
  - It will display as ON when the real power is ON, responding to ping and having powerstate different than standby (RealPower = ON)
  - It will just control the power. So if the TV real power is OFF and you switch this to ON, the TV will turn ON to the last state. If it was in Art Mode it will go in Art Mode, if it was on an app / hdmi / digitalTV / ... it will go back to that state

## Options

With this version we implemented an `options` key which allows you to set up a few things.

- `Frame.ArtSwitch.Disable`
  - This will remove the default Art Mode Switch

- `Frame.PowerSwitch.Disable`
  - This will remove the default Power Switch

- `Frame.RealPowerMode`
  - This will change the behaivor of the main accessory
  - When you toggle the main accessory ON/OFF it will actually control the real power of TV
  - Main accessory will display as ON when the TV real power is ON
  - Main accessory will display as OFF when the TV real power is OFF

Example of config:

``` json
{
    "name": "Frame TV",
    "ip": "192.168.10.230",
    "mac": "4C:C9:5E:94:39:BC",
    "options": [
        "Frame.RealPowerMode",
        "Frame.ArtSwitch.Disable",
        "Frame.PowerSwitch.Disable"
    ]
}
```

## Art input

We added a new type of input for Frame TVs. This only make sense in combination with `Frame.RealPowerMode` option set.

Unfortunately updating the inputs as soon as you toggle the Art Mode Switch was not possible right now because of a problem creating delays of requests and triggering timeouts.
I will look into it and add it soon. But until then, it will only update the inputs when Home App request it (usually when you open the home app).

Example of how to add the new input:

``` json
{
    "name": "Frame TV",
    "ip": "192.168.10.230",
    "mac": "4C:C9:5E:94:39:BC",
    "options": [
        "Frame.RealPowerMode"
    ],
    "inputs": [
        {"name": "Art Mode", "type": "art"}
    ]
}
```
