# Plugin installation

## Using Homebridge UI

Open Homebridge UI and select the `Plugins` tab.

![Plugin installation select Plugins](/images/install.plugin-ui-x-one.png)

Search for `homebridge-samsung-tizen` and press Enter.

Install the plugin from the result.

![Plugin installation search and install](/images/install.plugin-ui-x-two.png)

When installation finishes, open the plugin settings and add a TV. The steps are on the [next page](/installation/setting-the-device.md).

## Using the command line

If Homebridge was installed with `hb-service`:

```bash
hb-service add homebridge-samsung-tizen
```

Or with npm:

```bash
npm install -g homebridge-samsung-tizen
```

The plugin is installed. Add each TV from the [settings screen](/installation/setting-the-device.md), or by editing `config.json` as shown on that page.
