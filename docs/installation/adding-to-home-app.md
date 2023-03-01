# Adding to Home app

Each TV will be declared as external accessory and that means for each TV will be created a separate bridge that needs to be added in Home app. This means that the TV will not appear in your Home app until you add the device.

Because of this you don't need to run the plugin as **Child bridge**! If you don't know what Child bridge is, that means you are not using it so you are ok :)

Open the Home App on your iPhone or iPad. At the moment Apple don't allow you to add accessories from MacOS.

From the top right corner click on the **+** *(plus sign)* and after that select **Add Accessory**.

![Add to Home step one](~@images/install.assign-home-one.jpg)

Next from the popup click on **More options...**.

![Add to Home step two](~@images/install.assign-home-two.jpg)

Click on the device you want to add.

![Add to Home step three](~@images/install.assign-home-three.jpg)

You will get a notification telling you that the accessory is uncertified. That's ok, it's expected since we don't have a device that is compatible with HomeKit from the factory. Click **Add Anyway** to move on to the next step.

![Add to Home step four](~@images/install.assign-home-four.jpg)

In the next step you will have to enter the setup code. When you start the Homebridge server in the console you will get a message with the setup code for each device. If you don't have access to the console, the setup code is the same as the main homebridge server.

``` bash
[3/1/2023, 1:34:25 PM] Bedroom TV E1AA is running on port 43433.
[3/1/2023, 1:34:25 PM] Please add [Bedroom TV E1AA] manually in Home app. Setup Code: 770-74-597
```

You can see the message in the console with the setup code `770-74-597`.

Add the code in the input then click **Continue** button.

![Add to Home step five](~@images/install.assign-home-five.jpg)

Next follow the steps where you can select different configurations (like the room to assign the device) and at the end you should see the device in your list.

![Add to Home step six](~@images/install.assign-home-six.png)