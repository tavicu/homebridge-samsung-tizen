# Change Log

## 4.0.0

* Bug fixing
* New method for declaring accessories.

**IMPORTANT!** With this release the TVs will be declared as external accessories.
Updating from v3 to v4 will require you to add the TVs in Home app again.

This is required because HomeKit expects only one TV per bridge and now every TV will act as a bridge.

You can read how to add the TV in [Step 6 from Configuration page](https://github.com/tavicu/homebridge-samsung-tizen/wiki/Installation#6-adding-the-tv-to-home-app)

## 3.1.3

* Never fail custom switches for better working with automations

## 3.1.1

* Fix a bug that didn't display installed apps when running `tizen-apps`
* Improvements of how accessories are created

## 3.1.0

* Bug fixing
* Change default settings for `refresh` option
* Option to change remote keys mapping

## 3.0.0

* Use the new iOS 12.2 support for `Television` as accessory type
* Option to add inputs for TV with the new iOS 12.2 feature
* Control TV from Remote Control Center
* Save the token automaticaly on the server
* More options for `refresh` in real time
* Better logging in debug mode
* New method to check if TV is active
* Option to hold a command key for a time

## 2.1.0

* Option to open applications with a switch
* New support to update the switches with state in real time