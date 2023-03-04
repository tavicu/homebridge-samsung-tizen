---
sidebarDepth: 0
---

# Common issues

Here are listed the most common issues that users had using the plugin.

## TV is turning ON but no other command works

Turning ON the TV is working because is using a general protocol (Wake on LAN) which is compatible with most of the devices. The rest of the commands are sent through Samsung API and if your TV is not compatible they will not work!

If your TV is [compatible](installation/index.md#check-compatibility) make sure you didn't click `Deny` when the popup to pair appeared.
On TV go to `Settings` - `General` - `External Device Manager` - `Device Connection Manager` - `Device List` and make sure you didn't select `Deny`.

## The pairing popup it's not shown on the TV

This may happend because your TV is not [compatible](installation/index.md#check-compatibility) with the plugin or because you previously clicked `Deny` when the popup to ask for permission appeared. Please look [here](installation/pairing-the-device.md#clicked-deny-by-mistake) to see how you can check if you denied access and if you still didn't solve the problem [open a new issue](/troubleshooting/open-new-issue.md) and provide debug logs from the console.

## TV is always asking for permissions

When you click `Allow` on the permissions popup a token is provided by TV to use for future connections. That token is saved on a file. The problem may appear because the server don't have access to write that file. When you start the Homebridge server in debug mode you should see in the console details that are saved for each TV, and there it should have the token.

``` bash
[3/2/2023, 3:55:10 PM] [Bedroom TV] [DEBUG] {
  frametv: false,
  tokenauth: true,
  powerstate: false,
  token: '77050680'
}
```

Also go on your TV to `Settings` - `General` - `External Device Manager` - `Device Connection Manager` and set `Access Notification` to `Off`.

## Inputs are appearing like separate accessories

Sometimes when you add inputs it takes some time for HomeKit to link them to TV. You can try restarting the Home app on your phone, some suggested this will fix the problem. If it's still not working after that just wait, it will link after some time.

## The TV don't appear when I try to add it in Home app

Each device have a unique id that is used by Home app for pairing. By default UUID is created from the MAC address since this is unique for each TV.

But there are times when the TV was unpaired from Home app but not from the Homebridge server. This will result in not being able to add the accessory again in Home app.

To change the unique id of the device we have a parameter named `uuid` where you can insert any random string.

``` json
{
    "name": "Bedroom TV",
    "ip": "10.20.30.40",
    "mac": "A0:B1:C2:D3:E4:F5",
    "uuid": "a1"
}
```

## Add new buttons for Apple TV Remote

Plugins can't decide what buttons to show on Apple TV Remote. They are set by Apple and they are the same for all TVs. As developers we can only assign one action to run when a button is pressed.

## Hide TV from Apple TV Remote

Unfortunately we don't have the option to do this. By default all TVs are added to Apple TV Remote and can't be removed.

## My automations are not reliable

Because Samsung is not providing us a reliable API to get the state of TV. Because of this we are making multiple checks and *hacks* to decide the state. Unfortunately these methods are not 100% accurate every time and they can return a wrong status. If you have automations that are depending on the state of TV (like turning on the lamps) I recommend getting a smart plug that reports back the power usage and make automations based on that.

We are actively working to improve the process that checks the state of TV.

## I have added the main bridge and the TVs don't appear

Apple require heavy accessories like TVs and Cameras to have their own bridge. It is done so that in case of a problem, the rest of the accessories to not be affected.

That's why for each TV the plugin created a separate bridge that needs to be [added to Home app](/installation/adding-to-home-app.md). Only after adding the TV bridge it will show in your home.

## I want to avoid using SmartThings API

It is not a problem if you don't want to use SmartThings API. The plugin will works just fine buy you will not be able to use features that require SmartThings API to be configured, like selecting a specific input source (for example `HDMI1`).

## I get 401 - Unauthorized error

That error comes from SmartThing API and it's because of the `api_key`. You probably didn't set the parameter in config file or you copied the wrong key. Follow the steps from [configuration page](/configuration/smartthings-api.md#getting-the-api-key) on how to get the `api_key`.

## I get 403 - Forbidden error

That error comes from SmartThing API. You most likely didn't select required permission for the token created on SmartThings or you copied the wrong `device_id`. Make sure to check all the boxes on `Authorized Scopes` when you create a token. Follow the steps from [configuration page](/configuration/smartthings-api.md#getting-the-api-key) on how to setup SmartThings corectly.

## My new Frame TV don't work as it should

Staring from **2022 (Tizen 6.5)** Samsung have decided to remove the API that was used for Art Mode from Frame TVs and they didn't provide any other alternative (yet). You can read more regarding this on the [Frame TVs page](/configuration/frame-tvs.md).

## Devices are running on random ports

The plugin is not deciding on what port each TV will run and from my experience Homebridge won't assign a different port when restarting the server. But if you are in this scenario, Homebridge allows you to set a range of ports to be used for external accessories like TVs.

``` json
{
    "bridge": {
        ...
    },
    "ports": {
        "start": 51510,
        "end": 51550
    },
    "description": "",
    "accessories": [],
    "platforms": []
}
```

## Homebridge shows a speaker but not exposed to Home app

When the accessory is created a speaker option will be added to it. Homebridge UI shows that speaker in the **Accessories** page but in Home app this will not be shown. This feature is required in order to control the volume of TV from Apple TV Remote.

To access Apple TV Remote open the Control Center by swiping down from the upper-right corner of the screen.
