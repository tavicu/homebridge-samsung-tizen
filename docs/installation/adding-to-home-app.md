# Adding to Home app

Each TV is an external accessory. Homebridge publishes it on its own, separate from the main Homebridge bridge, so every TV has to be added in the Home app. Adding the main bridge does not add the TVs.

::: tip Child bridge
Homebridge has an option called **child bridge**, which runs a plugin on its own bridge. This plugin does not need it, because every TV is already published on its own. If it is turned on, the settings screen shows a warning. Turn it off.
:::

## Before you start

- Homebridge is running and the TV is in the plugin settings.
- Your iPhone or iPad is on the same network as Homebridge. Home finds the TV on the local network, so it does not appear over mobile data or from another network.
- Use the Home app on an iPhone or iPad. Apple does not let you add accessories from macOS.

## Add the TV

Tap **+** in the top right corner, then **Add Accessory**.

![Add to Home step one](/images/install.assign-home-one.jpg)

Tap **More options...**.

![Add to Home step two](/images/install.assign-home-two.jpg)

Tap the TV you want to add. Its name is the name from your config followed by four characters, for example `Bedroom TV E1AA`. The same name appears in the Homebridge log, so you can tell several TVs apart.

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

Repeat these steps for every TV.

## After you add the TV

- The TV tile turns the TV on and off, and its settings list the [inputs](/features/inputs.md) you added. New inputs can take a while to attach to the TV.
- [Custom switches](/features/switches.md) and, on a Frame, the [Art Mode and Power switches](/configuration/frame-tvs.md#art-mode-and-power-switches) are part of the TV accessory.
- With `Volume.Slider.Enable`, the TV also has a [volume slider](/features/volume.md#volume-slider), shown as a light.
- The TV is added to the remote in Control Center. See [Keys](/features/keys.md).

## The TV is not in the list

- Check that Homebridge is running and that the log shows the TV with its setup code.
- Check that the iPhone is on the same network as Homebridge.
- If the TV was added to Home before and then removed, Home may not offer it again. See [The TV does not appear when I try to add it in Home](/troubleshooting/common-issues.md#the-tv-does-not-appear-when-i-try-to-add-it-in-home).

::: tip
Removing the TV from Home and adding it again does not fix a pairing, network or SmartThings problem. It only resets the room, names, scenes and automations of that TV. Check [common issues](/troubleshooting/common-issues.md) first.
:::
