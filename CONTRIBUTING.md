# Contributing

Thank you for wanting to help. This plugin runs on many different Samsung TVs, firmware versions, networks and Homebridge setups. A change that fixes one TV can easily break ten others. That is why every change starts with a conversation, not with code.

## Start with an issue

Before writing any code, [open an issue](https://github.com/tavicu/homebridge-samsung-tizen/issues/new/choose) and describe what you want to change and why.

- **For a problem**, the first goal is to understand **why** it happens, not to make it go away on your TV. Attach debug logs, your TV model and year, and the relevant part of your config. Once the cause is clear, we look for a fix that works for everyone who uses the plugin.
- **For a new feature**, explain what you cannot do today and why it matters. We first agree that the feature belongs in the plugin, and only then how it should work.

A solution that only works for one TV, one network or one config is not a fix. It is a workaround, and it usually belongs in your own setup, not in the plugin.

## Pull requests

Pull requests are not open to everyone. Changes are implemented by the maintainer once an issue has been discussed and the approach is agreed on. If, in that discussion, it makes sense for you to implement it, you will be invited to.

Please do not send a ready-made patch or branch in an issue instead of describing the problem. Code that was not discussed first will not be reviewed, however much work went into it.

## About AI-generated code

AI tools are fine for exploring a problem. They are not a substitute for understanding it. A patch generated to make the symptom disappear on your TV, without knowing why it appeared, almost always breaks something else: another model, another firmware, the Frame Art Mode, SmartThings, or the way existing users have their setup.

If you used AI to investigate, share what you **found** in the issue: the cause, the logs that show it, what you tested. That is far more useful than the code.

## What helps most

- Clear bug reports with debug logs, following the [issue template](https://github.com/tavicu/homebridge-samsung-tizen/issues/new/choose)
- Testing a fix or a beta on your TV and reporting back
- Checking the [documentation](https://tavicu.github.io/homebridge-samsung-tizen/) and [common issues](https://tavicu.github.io/homebridge-samsung-tizen/troubleshooting/common-issues.html) before opening a new issue
- Answering other users' questions when you know the answer
