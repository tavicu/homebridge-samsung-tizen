# Plugin installation

::: tip Before you install
Check the [requirements](/installation/index.md#requirements). The plugin needs Node.js `22.10+`, `24`, or `26` and Homebridge `1.8` or newer. On an older version the installation fails or the plugin does not start.
:::

::: warning Already using version 5?
Read [Upgrading from version 5](/extra/upgrading.md) before you update. Your TVs stay in Home, but SmartThings has to be authorized again and a few settings changed.
:::

## Using Homebridge UI

Open Homebridge UI and select the `Plugins` tab.

![Plugin installation select Plugins](/images/install.plugin-ui-x-one.png)

Search for `homebridge-samsung-tizen` and press Enter.

Install the plugin from the result.

![Plugin installation search and install](/images/install.plugin-ui-x-two.png)

When the installation finishes, open the plugin settings and add a TV. The steps are on the [next page](/installation/setting-the-device.md).

## Using the command line

If Homebridge was installed with `hb-service`:

```bash
hb-service add homebridge-samsung-tizen
```

Or with npm:

```bash
npm install -g homebridge-samsung-tizen
```

Restart Homebridge after the installation, so it loads the plugin. Then add each TV from the [settings screen](/installation/setting-the-device.md), or by editing `config.json` as shown on that page.

## Beta versions

Large changes are published as a beta before they are released for everyone. A beta lets you try new features early, and your feedback helps find problems before the final release.

A beta can still have bugs, so install it only if you are comfortable reporting what does not work, with debug logs. You can go back to the stable version at any time, the same way you installed the beta.

The steps are on the [Installing a beta version](/extra/install-beta.md) page.
