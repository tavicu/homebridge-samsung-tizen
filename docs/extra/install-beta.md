# Installing a beta version

Large changes are published as a beta before they are released for everyone. A beta lets you try new features early, and your feedback helps find problems before the final release.

A beta can still have bugs. Install it only if you are comfortable reporting what does not work.

## Before you install

- Read the release notes of the beta on the [Releases page](https://github.com/tavicu/homebridge-samsung-tizen/releases). They list what changed, and the requirements if they are different from the current version.
- If the beta is a new major version, read the upgrade guide for it in this documentation first.

## Using Homebridge UI

Open the `Plugins` tab.

Click the wrench icon and select `Install Alternate Version`.

![Beta version menu](/images/extra.beta-one.png)

Select the beta version in the list and click `Install`.

![Beta version install](/images/extra.beta-two.png)

Restart Homebridge when the installation finishes.

## Using the command line

With `hb-service`:

```bash
hb-service add homebridge-samsung-tizen@beta
```

With npm, add `-g` when the plugin is installed globally:

```bash
npm install -g homebridge-samsung-tizen@beta
```

Restart Homebridge after the installation.

## Reporting a problem

If something does not work in the beta, [open an issue](/troubleshooting/open-new-issue.md) with debug logs, and mention the beta version you use.

## Going back to the stable version

In Homebridge UI, use `Install Alternate Version` again and pick the latest version that is not a beta.

From the command line, install the `latest` version:

```bash
hb-service add homebridge-samsung-tizen@latest
```

```bash
npm install -g homebridge-samsung-tizen@latest
```

Restart Homebridge afterwards.
