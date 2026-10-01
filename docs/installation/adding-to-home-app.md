# Adding to Home app

Each TV is an external accessory. Homebridge creates a separate bridge for it, and that bridge has to be added in the Home app. The TV will not appear in your Home app until you add the device.

Homebridge has an option called **child bridge**, which runs a plugin on its own bridge. If you turned that on for this plugin, you do not need it. It has no effect, because the plugin already publishes each TV on its own bridge.

Open the Home app on an iPhone or iPad. Apple does not let you add accessories from macOS.

Tap **+** in the top right corner, then **Add Accessory**.

![Add to Home step one](/images/install.assign-home-one.jpg)

Tap **More options...**.

![Add to Home step two](/images/install.assign-home-two.jpg)

Tap the TV you want to add.

![Add to Home step three](/images/install.assign-home-three.jpg)

Home says the accessory is uncertified. That is expected. Tap **Add Anyway**.

![Add to Home step four](/images/install.assign-home-four.jpg)

Enter the setup code. Homebridge prints one for each TV when it starts. If you cannot see the log, the code is the same as the main Homebridge bridge.

```bash
[3/1/2023, 1:34:25 PM] Bedroom TV E1AA is running on port 43433.
[3/1/2023, 1:34:25 PM] Please add [Bedroom TV E1AA] manually in Home app. Setup Code: 770-74-597
```

The setup code in that example is `770-74-597`.

Type the code and tap **Continue**.

![Add to Home step five](/images/install.assign-home-five.jpg)

Finish the room and name steps. The TV then appears in the home.

![Add to Home step six](/images/install.assign-home-six.png)
