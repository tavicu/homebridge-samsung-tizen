# How to open a new issue

Check this documentation and the [common issues](/troubleshooting/common-issues.md) page first. Search the [existing issues](https://github.com/tavicu/homebridge-samsung-tizen/issues?q=is%3Aissue), including closed ones. The same problem may already have an answer.

Open a new issue from the [Issues page](https://github.com/tavicu/homebridge-samsung-tizen/issues/new/choose) and pick the form that fits:

- **Bug report** when something does not work as expected. Debug logs are required.
- **Question** when you want to know how something works or how to set it up.
- **Feature request** when you want something the plugin does not do yet.

The bug report form asks for:

1. Plugin version, for example `6.0.0`
2. Homebridge and Node.js versions
3. TV model and year, for example QE55Q80T / 2020
4. Whether the TV is on the same subnet as Homebridge
5. What you expected, what happened, and how to repeat it
6. Debug logs
7. The relevant part of `config.json`, optional

::: danger
Remove `clientId`, `clientSecret` and `deviceId` before you paste the config. Remove tokens and authorization codes from logs.
:::

## Debug logs

::: warning
If something fails, start Homebridge in debug mode and attach the lines for that TV. An issue without those logs will be closed.
:::

Useful lines contain the TV name from your config, or `homebridge-samsung-tizen`.

![Log lines for the TV](/images/trouble.console-one.png)

Gray lines are debug. Red lines are failures. The debug lines just after a failure usually say why the command failed.

![Debug lines after a failure](/images/trouble.console-two.png)

### Enable debug mode

In Homebridge UI, open the menu in the upper-right corner and select `Homebridge Settings`.

Under `Startup Options`, enable `Homebridge Debug Mode -D`, then restart Homebridge.

![Enable debug mode](/images/trouble.open-issue.png)

---

From the command line:

```bash
homebridge -D
```
