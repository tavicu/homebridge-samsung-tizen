# Installing beta version

When big features are developed we release a beta software that can be installed by anyone to test it and provide feedback before making it available to everyone.

## Using Homebridge UI

If you are unsing Config UI X you can install the beta version of the plugin right from the interface.

First access the interface and select the `Plugins` tab from the navbar.

Then click on the wrench icon and select `Install Alternate Version`.

![Beta Version one](~@images/extra.beta-one.png)

In the dropdown make sure it's selected the beta version and click `Install`.

![Beta Version two](~@images/extra.beta-two.png)

## Using Command Line

You can manually install the beta version with `npm` by running:

``` bash
npm install homebridge-samsung-tizen@beta
```

If the plugin is installed globally don't forget the `-g` attribute like this:

``` bash
npm install -g homebridge-samsung-tizen@beta
```
