# Installing a beta version

Large changes are published as a beta before they are released for everyone. Feedback goes on the [version 6 discussion](https://github.com/tavicu/homebridge-samsung-tizen/issues/756).

Version 6 needs Node.js 22.10+, 24, or 26, Homebridge 1.8 or newer, and Config UI X v5.27.0 or newer for the settings screen. Read [Upgrading from version 5](/extra/upgrading.md) before you install it over an existing setup.

## Using Homebridge UI

Open the `Plugins` tab.

Click the wrench icon and select `Install Alternate Version`.

![Beta version menu](/images/extra.beta-one.png)

Select the beta version in the list and click `Install`.

![Beta version install](/images/extra.beta-two.png)

## Using the command line

With `hb-service`:

```bash
hb-service add homebridge-samsung-tizen@beta
```

With npm, add `-g` when the plugin is installed globally:

```bash
npm install -g homebridge-samsung-tizen@beta
```
