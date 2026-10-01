# Pairing the device

Once you set up your devices in the configuration file, you need to restart the Homebridge server to apply the changes and to pair each device for the first time.

That start reaches the TV and asks for permission. After you allow the connection, the TV provides a token. The plugin saves it and uses it on later connections, so you will not have to allow the connection every time.

The pairing process starts after the Homebridge server has started. If it fails, the plugin will retry the pairing three times. After that, if it wasn't able to pair the device, it will show an error in the console. To start the pairing process again you will have to restart the Homebridge server. The TV needs to be on, otherwise the prompt never appears.

When the prompt appears, choose **Allow**.

![Pairing prompt on the TV](/images/install.pairing-device.jpg)

### Clicked Deny by mistake

**Deny** is remembered by the TV, and later connections are rejected. On the TV open `Settings` → `General` → `External Device Manager` → `Device Connection Manager` → `Device List`, look for **Homebridge** in the list, and either change it to Allow or delete the entry. Restart Homebridge to show the prompt again.

![Setting device saving configuration](/images/install.pairing-device.jpg)
