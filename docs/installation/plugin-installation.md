# Plugin installation

::: warning HOOBS Users
This plugin was designed for **Homebridge** server. 
At the moment the plugin works with HOOBS too but unfortunately we cannot offer any support for it and we cannot guarantee how it will works in the future since we are not following HOOBS releases and changes.
:::

## Using Homebridge UI

If you are unsing Config UI X you can install the plugin right from the interface.

First access the interface and select the `Plugins` tab from the navbar.
![Plugin installation select Plugins](~@images/install.plugin-ui-x-one.png)

Then search for `homebridge-samsung-tizen` in the search box and press `enter` key on your keyboard.

You should now see the plugin and click `INSTALL`.
![Plugin installation search and install](~@images/install.plugin-ui-x-two.png)

Wait for the installation to finish and a modal will appear where you can configure the devices.

Please follow the steps from the [next page](/installation/setting-the-device.md#using-homebridge-ui) where you can see how to setup setup your device using Homebridge UI.

## Using Command Line

You can manually install the plugin by running:

``` bash
npm install -g --unsafe-perm homebridge-samsung-tizen
```

That's it! The plugin is now installed and you can follow the steps from the [next page](/installation/setting-the-device.md#manual-configuration) on how to setup devices using your `config.json` file.