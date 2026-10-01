# SmartThings

::: warning
SmartThings features are not local. Homebridge sends those requests to the SmartThings API, so the server needs internet access. Power, volume, mute, apps, and remote keys do not use SmartThings.
:::

::: tip
If the SmartThings app on your phone is left unused for a long time, SmartThings can drop the TV. Control stops until you add the TV in the app again.
:::

SmartThings is optional. Without it, the plugin still turns the TV on and off, changes the volume, launches apps, and sends remote keys.

These actions need SmartThings, plus a device id on that TV:

- Select a source such as Digital TV, HDMI, USB, USB-C, or DisplayPort
- Set a picture mode or a sound mode
- Change the channel through the API. Without SmartThings, a channel switch falls back to sending the digit keys
- Turn a Frame fully off. See [Frame TVs](/configuration/frame-tvs.md)

Absolute volume does **not** need SmartThings. See [Volume](/features/volume.md).

Personal access tokens are no longer accepted. You create a SmartThings app once, enter the client id and client secret, and the plugin refreshes the access token on its own.

::: danger
Do not post `clientSecret` or `deviceId` in a public issue or screenshot. Anyone with the client secret can request tokens for your app.
:::

## Create the SmartThings app

Install the TV in the SmartThings app and confirm you can control it from there.

Install the [SmartThings CLI](https://github.com/SmartThingsCommunity/smartthings-cli), then run:

```bash
smartthings apps:create
```

The command opens a browser so you can sign in. Use these answers:

- **App Type:** `OAuth-In App`
- **Display Name:** `Homebridge Samsung-Tizen` (any name is fine)
- **Description:** `Monitor and control Samsung Smart TVs via SmartThings API`
- **Icon Image URL:** leave empty
- **Target URL:** `https://tavicu.github.io/homebridge-samsung-tizen/token.html`
- **Scopes:** only `r:devices:*` and `x:devices:*`
- **Redirect URI:** `https://tavicu.github.io/homebridge-samsung-tizen/token.html`

Finish the redirect URIs, then finish creating the app. Copy the **OAuth Client ID** and **OAuth Client Secret**. They are shown once.

## Connect from Homebridge UI

Open the plugin settings. On the SmartThings card, choose **Connect to SmartThings**.

1. Paste the client id and client secret. **Continue** builds the authorization URL and saves those two values in the plugin config.
2. Copy the authorization URL, open it in a browser, and allow access. The browser lands on the token page with a code. Copy that code.
3. Paste the code into **Authorization Code** and choose **Authorize**.

When it succeeds, the card shows **Connected**. If the code was wrong, expired, or already used, the wizard says so. Start again and use a fresh code.

**Edit Credentials** runs the wizard again. **Disconnect** removes the stored tokens. Features that need SmartThings stop until you connect again. If the card says **Expired**, choose **Re-authorize SmartThings**.

## Pick the TV

After SmartThings is connected, edit a TV and pick it from the device list. The list comes from your SmartThings account. If the TV is not there, choose **Other** and paste the id.

The same connection fills input sources, picture modes, and sound modes when you edit an input or a switch for that TV. Installed apps, when the TV has already reported them, show up in the application list. You can still type an id by choosing **Other**.

Until this flow is done, every feature that depends on SmartThings stays unavailable.

## What the plugin ignores

SmartThings values for the active input, picture mode, sound mode, and channel are ignored when SmartThings has not updated them for more than 24 hours. That keeps Home from showing the last source after the TV has been off or has lost its cloud connection.

## Manual configuration

The settings screen writes the same keys. `clientId` and `clientSecret` sit on the platform. `deviceId` sits on each TV.

```json
{
  "platform": "SamsungTizen",
  "clientId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "clientSecret": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "devices": [
    {
      "name": "Bedroom TV",
      "ip": "10.20.30.40",
      "mac": "A0:B1:C2:D3:E4:F5",
      "deviceId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
    }
  ]
}
```

Restart Homebridge after you save. The authorization code from the token page still has to be exchanged once from the wizard. Pasting only the client id and secret does not connect the account.
