---
sidebarDepth: 0
---

# How to open new issue

Before opening a new issue make sure you checked the documentation for a solution to your problem and also check the [Common issues page](/troubleshooting/common-issues.md).

It is recommended to also search the [closed issues](https://github.com/tavicu/homebridge-samsung-tizen/issues?q=is%3Aissue+), maybe someone already had your problem and he found a solution.

Try to describe your problem in a few words and how we can replicate it, with all the details you can provide and you think it will make it easier for us to help you.

If you problem is related to configuration or that something it's not working please also include the **configuration file** but make sure to remove sensitive informations like `api_key` or `device_id`.

::: warning
If you have a technical problem and something it's not working as it should you are required to start the plugin in debug mode and provide logs from the console related to the plugin and the problem. If you don't provide this information the issue will be closed without response.
:::

To identify what logs are helpful you must look for logs that include the name of the TV you set in config file or for the plugin name (for example `Bedroom TV` or `homebridge-samsung-tizen`).

![Troubleshooting console one](~@images/trouble.console-one.png)

The logs in gray are debug logs and the ones in red are failures. Usually if you start the plugin in debug mode right after a failure log you will have some debug lines that tells why the command failed and the root of the problem. This is very important in finding a solution to your problem!

![Troubleshooting console two](~@images/trouble.console-two.png)

Once you are sure you want to open a new issue you can access the [Issues page](https://github.com/tavicu/homebridge-samsung-tizen/issues) from GitHub. Please make sure to follow instructions from there.

## Enable debug mode

If you are using Homebridge UI you can do this from the settings.

Press the three dots from the upper-right corner then select `Homebridge Settings`.

Then on the `Startup Options` make sure to enable the radio button for `Homebridge Debug Mode -D`.

![Troubleshooting enable debug mode](~@images/trouble.open-issue.png)

***

If you are starting your Homebridge server from Command Line then you can use this command to start it in debug mode:

``` bash
DEBUG=* homebridge -D
```
