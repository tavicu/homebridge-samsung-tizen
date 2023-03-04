# Getting started

## Check compatibility

Samsung TVs have different methods of pairing and API depending on what model of TV you have and what year was released. TVs released before 2017 uses another pairing method, known as PIN method, which this plugin does not support. Your TV needs to be released starting with 2017 to be compatible.

First step is to access the folowing url `http://TV_IP:8001/api/v2/` (replace TV_IP with the IP your TV has). The page should return informations regarding your TV. If the endpoint is not working then your TV is not compatible with the plugin.

You can read more regaring the API on [Samsung Developers page](https://developer.samsung.com/tv/develop/extension-libraries/smart-view-sdk/receiver-apps/debugging).

Some older TVs respond to that API even if they use PIN method as pairing. Starting with Tizen 3.0 (2017 model) the dashoard design was changed and we can see very easy if the TV is compatible by check it.

| Compatible                                     | Not compatible                                         |
| ---------------------------------------------- | ------------------------------------------------------ |
| ![Compatible](~@images/install.compatible.jpg) | ![Not Compatible](~@images/install.not-compatible.jpg) |

## Homebridge Server

This plugin was designed for Homebridge and it will require you to have a Homebridge server set up.

Homebridge is a lightweight server you can run on your home network that emulates the iOS HomeKit API and it allows you to control devices that are not compatible with HomeKit.

You can follow the steps from [Homebridge documentation](https://github.com/homebridge/homebridge/blob/master/README.md) on how to install and run the server and also learn more regarding Homebridge.
