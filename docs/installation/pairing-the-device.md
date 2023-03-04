# Pairing the device

Once you set up your devices in the configuration file you need to restart the Homebridge server to apply the changes and to pair each device for the first time.

This will access the TV and request access for the plugin. After you allow the connection the TV will provide a token that it will be saved and used on the future connections so you will not have to allow connection every time.

The pairing process will be initiated after Homebridge server started and it case of failure it will retry the pairing three times. After that if it wasn't abel to pair the device it will show an error in the console. To start the pairing process again you will have to restart the Homebridge server.

After the Homebridge server starts you should see a popup on your TV asking to give permissions for connection. You need to click **Allow** button.

![Setting device saving configuration](~@images/install.pairing-device.jpg)

### Clicked Deny by mistake

In case you click **Deny** by mistake the TV will remember and it will reject all future connections. What you need to do is go to `Settings` -> `General` -> `External Device Manager` -> `Device Connection Manager` -> `Device List` and change the permission to Allow or just remove the entry and restart the Homebridge server to initiate the pairing procedure.
