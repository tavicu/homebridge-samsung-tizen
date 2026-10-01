---
sidebarDepth: 0
---

# How to open a new issue

Check this documentation and the [common issues](/troubleshooting/common-issues.md) page first. Search the [existing issues](https://github.com/tavicu/homebridge-samsung-tizen/issues?q=is%3Aissue+), including closed ones. The same problem may already have an answer.

Describe what you expected, what happened, and how to repeat it. Include:

1. Plugin version, for example `6.0.0`
2. Node.js, Homebridge, and Config UI X versions
3. TV model and year, for example QN90A / 2021
4. Whether SmartThings is connected
5. The relevant part of `config.json`

Remove `clientId`, `clientSecret`, and `deviceId` before you paste the config. Remove tokens from logs.

::: warning
If something fails, start Homebridge in debug mode and attach the lines for that TV. An issue without those logs will be closed.
:::

Useful lines contain the TV name from your config, or `homebridge-samsung-tizen`.

![Log lines for the TV](/images/trouble.console-one.png)

Gray lines are debug. Red lines are failures. The debug lines just after a failure usually say why the command failed.

![Debug lines after a failure](/images/trouble.console-two.png)

Open a new issue from the [Issues page](https://github.com/tavicu/homebridge-samsung-tizen/issues).

## Enable debug mode

In Homebridge UI, open the menu in the upper-right corner and select `Homebridge Settings`.

Under `Startup Options`, enable `Homebridge Debug Mode -D`.

![Enable debug mode](/images/trouble.open-issue.png)

---

From the command line:

```bash
DEBUG=* homebridge -D
```
