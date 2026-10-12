# homebridge-samsung-tizen

[![Donate PayPal](https://img.shields.io/badge/Donate-PayPal-green?logo=paypal&style=flat-square)](https://www.paypal.com/donate?hosted_button_id=5QLCDRNH77Z9L)
[![Buy me a coffee](https://img.shields.io/badge/Buy%20Me%20A%20Coffee-green?logo=buymeacoffee&style=flat-square)](https://www.buymeacoffee.com/tavicu)
[![verified-by-homebridge](https://img.shields.io/badge/homebridge-verified-blueviolet?style=flat-square)](https://github.com/homebridge/homebridge/wiki/Verified-Plugins)
[![npm version](https://img.shields.io/npm/v/homebridge-samsung-tizen?style=flat-square)](https://www.npmjs.com/package/homebridge-samsung-tizen)
[![Issues Status](https://img.shields.io/github/issues/tavicu/homebridge-samsung-tizen?style=flat-square)](https://github.com/tavicu/homebridge-samsung-tizen/issues)

Control Samsung TVs running Tizen OS (2017 and later) from Apple Home, through [Homebridge](https://github.com/homebridge/homebridge): power, inputs and apps, volume, the remote in Control Center, custom switches for scenes and automations, and Art Mode on Frame TVs.

Basic functionality runs entirely on your local network. No internet connection is required. That has been a core requirement of the plugin since the first release. Cloud services such as SmartThings are optional extras, not a dependency.

Devices and settings are managed from the plugin’s own interface in Homebridge UI. Step-by-step guides with screenshots live in the [documentation](https://tavicu.github.io/homebridge-samsung-tizen/).

## Version 6

This release is a full rewrite in TypeScript. It is backwards compatible: existing TVs stay in Home, so you do not have to add them again, and your current config keeps working. SmartThings has to be authorized again, and inputs or custom switches may need their Home names and scenes set up once more. A few settings were renamed or removed. The old names still work for now, and the log tells you what to change.

If you are coming from version 5, the [upgrade guide](https://tavicu.github.io/homebridge-samsung-tizen/extra/upgrading.html) has the steps.

**New in this release:**

- Configuration UI in Homebridge Config UI X (v5.27.0 or newer): add, edit and delete devices, inputs and switches without editing JSON
- Live power state through SSDP, with a fallback when announcements are missing
- Live volume and mute through DMR (UPnP), including absolute volume without SmartThings
- Keys, inputs and switches set once at plugin level and shared by every TV
- Optional volume slider, so scenes and automations can set the TV volume
- SmartThings OAuth instead of the old personal access tokens, with automatic token refresh
- Frame TVs: Art Mode is controlled on the local network. The TV tile is ON while you watch TV and OFF while Art Mode is on. The TV also gets Art Mode and Power switches

You can see the [changelog](CHANGELOG.md) for the full list of changes.

## Requirements

- A Samsung TV with Tizen OS, 2017 or newer, on the **same subnet** as Homebridge (Samsung blocks WebSocket access across VLANs). TVs from 2016 and earlier, which pair with a PIN, are not supported
- [Homebridge](https://github.com/homebridge/homebridge) 1.8 or newer (Homebridge 2.0 is recommended)
- Node.js 22.10+, 24, or 26
- A static IP for each TV on your router
- Homebridge Config UI X v5.27.0 or newer, for the configuration interface
- For live volume and mute, the TV must be able to reach Homebridge. If Homebridge runs in Docker, use host networking

## Install

In Homebridge UI, open the Plugins tab, search for `homebridge-samsung-tizen` and install it.

From the command line:

```bash
hb-service add homebridge-samsung-tizen
```

## Setup

1. Open the plugin settings in Homebridge UI and add a TV (name, IP, MAC). The **Test** button next to the IP address checks that the TV can be reached and is supported. It also fills in the MAC address if the field is empty.
2. Restart Homebridge and turn the TV on. Allow the pairing prompt that appears on the TV. If the TV was off when Homebridge started, the prompt appears as soon as you turn it on, without another restart.
3. In the Home app, tap **Add Accessory**, then **More options...**, choose the TV and enter the setup code that Homebridge prints in the log for it.

Each TV is published as its own accessory, separate from the main Homebridge bridge. Adding the bridge to Home does not add the TVs, so repeat step 3 for every TV.

If you clicked Deny on the pairing prompt, on the TV go to **Settings → General → External Device Manager → Device Connection Manager → Device List** (on newer TVs the menu is **General & Privacy**) and allow **Homebridge**. You can also remove the entry, and the prompt appears again the next time the TV turns on.

SmartThings is optional. It adds what Samsung only offers through its cloud: selecting a source such as HDMI, picture and sound modes, and a full power off on Frame TVs. It has a wizard in the same settings screen, and the [SmartThings guide](https://tavicu.github.io/homebridge-samsung-tizen/smartthings/) covers every step. You create a SmartThings app once, paste the client ID and secret, and the plugin refreshes the access token on its own. If the authorization ever expires, the plugin writes it in the log and the settings screen shows it as expired. Go through the wizard again and the plugin picks up the new authorization.

## Help

Most pairing, network and Home app questions are already answered on the [common issues](https://tavicu.github.io/homebridge-samsung-tizen/troubleshooting/common-issues.html) page from our documentation. If you are stuck, [open an issue](https://github.com/tavicu/homebridge-samsung-tizen/issues) and include debug logs from Homebridge. There is a [how to open a new issue](https://tavicu.github.io/homebridge-samsung-tizen/troubleshooting/open-new-issue.html) page in the documentation with details.

## Support the project

If the plugin is useful, a GitHub star helps others find it. Sponsorships and donations are optional and very welcome. They go toward time spent on new features, maintenance and support, all of it in my spare time. I really appreciate any help you can give :)

- [PayPal](https://www.paypal.com/donate?hosted_button_id=5QLCDRNH77Z9L)
- [Buy Me a Coffee](https://www.buymeacoffee.com/tavicu)
- [GitHub Sponsors](https://github.com/sponsors/tavicu)
