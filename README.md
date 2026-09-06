# homebridge-samsung-tizen

[![Donate PayPal](https://img.shields.io/badge/Donate-PayPal-green?logo=paypal&style=flat-square)](https://www.paypal.com/donate?hosted_button_id=5QLCDRNH77Z9L)
[![Buy me a coffee](https://img.shields.io/badge/Buy%20Me%20A%20Coffee-green?logo=buymeacoffee&style=flat-square)](https://www.buymeacoffee.com/tavicu)
[![verified-by-homebridge](https://img.shields.io/badge/homebridge-verified-blueviolet?style=flat-square)](https://github.com/homebridge/homebridge/wiki/Verified-Plugins)
[![npm version](https://img.shields.io/npm/v/homebridge-samsung-tizen?style=flat-square)](https://www.npmjs.com/package/homebridge-samsung-tizen)
[![Issues Status](https://img.shields.io/github/issues/tavicu/homebridge-samsung-tizen?style=flat-square)](https://github.com/tavicu/homebridge-samsung-tizen/issues)

Control Samsung TVs running Tizen OS (2017 and later) from Apple Home, through [Homebridge](https://github.com/homebridge/homebridge).

Basic functionality runs entirely on your local network. No internet connection is required. That has been a core requirement of the plugin since the first release. Cloud services such as SmartThings are optional extras, not a dependency.

Devices and settings are managed from the plugin’s own interface in Homebridge UI. Step-by-step guides with screenshots live in the [documentation](https://tavicu.github.io/homebridge-samsung-tizen/).

## Version 6

This release is a full rewrite in TypeScript. Existing TVs stay in Home, so you do not have to add them again. A few settings changed, SmartThings has to be authorized again, and inputs or custom switches may need their Home names and scenes set up once more. Everything else is backwards compatible.

**New in this release:**

- Configuration UI in Homebridge Config UI X (v5.27.0 or newer): add, edit and delete devices, inputs and switches without editing JSON
- Live power state through SSDP, with a fallback when announcements are missing
- Live volume and mute through DMR (UPnP), including absolute volume without SmartThings
- Plugin-level defaults for keys, inputs, switches and Wake on LAN, inherited by every TV
- SmartThings OAuth instead of personal access tokens that no longer expire

You can see the [changelog](CHANGELOG.md) for the full list of changes.

**Not in this version yet:**

- Frame TV Art Mode and the related power/art switches. Those will come back in a later release.

## Requirements

- A Samsung TV with Tizen OS, 2017 or newer, on the **same subnet** as Homebridge (Samsung blocks WebSocket access across VLANs)
- [Homebridge](https://github.com/homebridge/homebridge) 1.8 or newer (Homebridge 2.0 is recommended)
- Node.js 22.10+, 24, or 26
- A static IP for each TV on your router

## Install

In Homebridge UI, open the Plugins tab, search for `homebridge-samsung-tizen` and install it.

From the command line:

```bash
hb-service add homebridge-samsung-tizen
```

## Setup

1. Open the plugin settings in Homebridge UI and add a TV (name, IP, MAC). There is a **Test connection** button on the device form.
2. Restart Homebridge. Allow the pairing prompt on the TV the first time it appears.
3. In the Home app, add the TV as a new accessory using the QR code Homebridge shows for that TV.

If you clicked Deny on the pairing prompt, on the TV go to **Settings → General → External Device Manager → Device Connection Manager → Device List** and allow the plugin (or remove the entry and restart Homebridge).

SmartThings, if you want it, has a wizard in the same settings screen. You create a SmartThings app once, paste the client ID and secret, and the plugin refreshes the access token on its own.

## Help

Most pairing, network and Home app questions are already answered on the [common issues](https://tavicu.github.io/homebridge-samsung-tizen/troubleshooting/common-issues.html) page from our documentation. If you are stuck, [open an issue](https://github.com/tavicu/homebridge-samsung-tizen/issues) and include debug logs from Homebridge. There is a [how to open a new issue](https://tavicu.github.io/homebridge-samsung-tizen/troubleshooting/open-new-issue.html) page in the documentation with details.

## Support the project

If the plugin is useful, a GitHub star helps others find it. Sponsorships and donations are optional and very welcome. They go toward time spent on new features, maintenance and support, all of it in my spare time. I really appreciate any help you can give :)

- [PayPal](https://www.paypal.com/donate?hosted_button_id=5QLCDRNH77Z9L)
- [Buy Me a Coffee](https://www.buymeacoffee.com/tavicu)
- [GitHub Sponsors](https://github.com/sponsors/tavicu)
