# AGENTS.md

Homebridge plugin that exposes Samsung Tizen TVs (2017 and later, The Frame included) to HomeKit. TypeScript, ESM, Node 22/24/26, Homebridge 1.8 and 2.x. Users run it on many models, firmware versions and networks: a change that fixes one TV can break ten others, so understand **why** something happens before changing code (see [CONTRIBUTING.md](CONTRIBUTING.md)).

Several behaviors described below look like bugs when the code is read on its own, but are deliberate: the 2.5 s answer to HomeKit, the power latch, the pings skipped after the TV turns off, the Frame tile that controls Art Mode. Each section says why it is there. Read it before reporting one of them as a bug or proposing to remove it.

## Principles and requirements

- Everything basic works on the local network, without internet. SmartThings is an optional extra for what Samsung only offers through its cloud (selecting a source such as HDMI, picture and sound modes, channels, a full power off on the Frame). A change must not make a basic feature depend on the cloud.
- The TV must be on the same subnet as Homebridge: Samsung blocks WebSocket access across VLANs. Each TV needs a static IP, because the IP is what the plugin connects to and how SSDP announcements are matched to a TV.
- Live volume and mute need the TV to reach Homebridge (UPnP sends its events to an HTTP server in the plugin). In Docker that means host networking.
- TVs from 2016 and earlier pair with a PIN and are not supported. A TV that reports `TokenAuthSupport` false gets a "not supported" warning.

## Commands

- `npm run build`: compiles `src` to `dist` with `tsc` and builds the settings UI (`homebridge-ui`) with Vite.
- `npm run lint` (ESLint, `--max-warnings=0`) and `npm run prettier` (format check). CI runs both and the build on Node 22, 24 and 26. `prepublishOnly` runs lint and build.
- `npm run watch`: builds, links the plugin and runs a local Homebridge from `test/hbConfig` (gitignored, holds a real config) with `hb-service`, recompiling `src` on every change (the settings UI has its own `npm run watch:ui`).
- There is no test suite. Behavior is checked on real TVs, often with a debug build sent to the user who reported the issue.

## Layout

- `src/platform.ts`: migrates the config, creates one `Device` per configured TV and the shared managers (SSDP, UPnP, SmartThings).
- `src/device/`: `Device` (state, events, accessories), `DeviceController` (every TV action), `PowerMonitor` (power detection), `AccessoryPoller` (polls services every 15 s while the TV is on).
- `src/protocols/`: one class per way of talking to the TV (table below).
- `src/accessories/` and `src/services/`: HomeKit accessories and services. Every service except inputs extends `ServiceWrapper` (`src/services/wrapper.ts`).
- `src/lib/`: helpers (`tools.ts` has `race`, `retry`, `debounce`, `throttle`), SSDP listener, Wake-on-LAN, storage, cache, config migration, HomeKit identifiers, switch options, remote key map, command parser.
- `src/errors.ts`: error classes, including the `IgnorableError` family. `src/types/`: shared types.
- `homebridge-ui/`: the settings UI, Vue 3 in `src`, built into `public`, with `server.js` as its backend. `server.js` imports the SSDP listener from `dist`, so the UI needs a build.

## How the plugin talks to the TV

| What                                                       | Where                                                                | Notes                                                                                           |
| ---------------------------------------------------------- | -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Remote keys, power on from standby, pairing, app list      | `protocols/websocket.ts`, `wss://ip:8002/.../samsung.remote.control` | Token saved in storage. Ready = `ms.channel.connect`. Installed apps via `ed.installedApp.get`. |
| Device info, app state, app launch                         | REST `http://ip:8001/api/v2/`                                        | `getInfo` sets `frameSupport`, `tokenSupport`, `powerStateSupport`, model, firmware.            |
| Art Mode, Frame power events                               | `protocols/frame.ts`, `wss://ip:8002/.../com.samsung.art-app`        | Only when `FrameTVSupport` is true. See the Frame section.                                      |
| Volume and mute                                            | `protocols/upnp.ts`, `http://ip:9197` RenderingControl               | SOAP to set and read, plus an event subscription so changes on the TV are pushed.               |
| Input source, picture/sound mode, channel, Frame power off | `protocols/smartthings.ts`                                           | Cloud API, OAuth set up in the settings UI, `deviceId` per TV. Optional.                        |
| Power on from fully off                                    | `lib/wol.ts`                                                         | Wake-on-LAN broadcast on every interface plus unicast to the TV IP.                             |
| Online/offline                                             | `lib/ssdp.ts`, `protocols/ssdp.ts`, ping on port 8001                | See Power detection.                                                                            |

## Config

- Platform-level `keys`, `inputs`, `switches` and `wol` are shared by every TV and merged with the TV's own (`deepmerge`: arrays are concatenated, the TV's values win for keys).
- Options per TV: `Device.Disable`, `Volume.Slider.Enable`, `Switch.DeviceName.Disable`, `Frame.RealPowerMode`, `Frame.ArtSwitch.Disable`, `Frame.PowerSwitch.Disable`.
- Version 5 configs are brought to the version 6 shape in memory by `lib/migrate.ts`. `config.json` is never written: the log tells the user what to change. Old picture mode names are mapped in `lib/switch.ts`. Existing configs must keep working.

## State and events

- `Device.state` (`power`, `mute`, `volume`, `artmode`) is a Proxy: setting a different value emits `state:update`, which re-syncs every accessory (debounced 200 ms). Setting the same value emits nothing, keep it that way.
- Protocols do not touch HomeKit. They emit events on the `Device` (`ssdp:update`, `upnp:update`, `frame:artmode`, `frame:power`, `apps:update`, `paired`), and `Device` / `PowerMonitor` turn them into state.
- `paired` fires once the plugin has a token: at startup when one is stored, otherwise after the user allows the pairing prompt on the TV. Pairing is tried while the TV is on and retried every time it turns on. The poller and the Frame socket start after `paired`, and the Frame switches are created then if the TV was not known as a Frame yet.
- `Cache` (`lib/cache.ts`) dedupes and caches TV reads for a short time (device info 2.5 s, app state 3 s) and is flushed on every power change. SmartThings status is cached 2.5 s on its own.

## HomeKit gets an answer within 2.5 s

HAP-NodeJS, which Homebridge uses to talk to HomeKit, logs "was slow to respond" for a handler that takes more than 3 s and answers HomeKit with a timeout after 9 s. The TV is often slower than that: Wake-on-LAN, a socket that is still connecting, the power latch, SmartThings (5 s request timeout). So every set handler goes through `ServiceWrapper.handleSet`, which wraps the action in `race(action)` from `lib/tools.ts` (default 2500 ms), below the 3 s warning:

- If the action finishes in time, its result is what HomeKit gets: success, or `SERVICE_COMMUNICATION_FAILURE` ("No Response") on error.
- If it takes longer, HomeKit gets success at 2.5 s and the action keeps running in the background. **An error thrown after that is swallowed by `race` and is not logged by `handleSet`.** If a late failure matters, it has to be logged inside the action itself.
- `IgnorableError` (`TvAlreadyOn/Off`, `TvPoweringError`) means "nothing to do": HomeKit gets success and nothing is logged as an error.
- Getters that HomeKit reads often answer from what is already known: the TV tile, speaker, volume slider and Frame switches read `Device` state, and the TV's input returns the current value and refreshes in the background (`TelevisionService.getInput` → `runAsyncInputUpdate`). Switches for an app, input, channel, picture or sound mode do ask the TV or SmartThings in their getter, through the caches above, and skip it while the TV is off.

Why it is done this way: most slow actions do succeed, just later than HomeKit is willing to wait. Waiting for them would show "No Response" on the tile and slow-plugin warnings in the Homebridge log for commands that worked. Answering at 2.5 s keeps the tile responsive, and the real state reaches HomeKit afterwards through the state events (power, Art Mode, volume, inputs), which correct the tile if the action did not take effect.

So "the plugin answers HomeKit before the TV has finished" and "the timeout hides the error" describe the design, not a bug. Awaiting the TV directly in a handler, removing the race or raising the timeout to make a slow action "work" brings back the problems above. A new set handler goes through `handleSet`, and a slow action is made to work in the background.

## Power detection (`device/power.ts`)

- Sources: SSDP `alive`/`byebye`, Frame `go_to_standby`/`wakeup`, ping on port 8001, and `PowerState` from device info when the TV reports it (`powerStateSupport`). A TV in standby still answers on port 8001, so with `PowerState` a reachable TV only counts as on when `PowerState` is `on`. Without it, reachable means on.
- Pings run every 45 s, after a UPnP event while the TV is off, and when a power latch ends. After an SSDP `alive` they are skipped for the announcement's max-age (at most 90 s).
- Without `PowerState`, a TV that turned off keeps answering on port 8001 for about 17 s in standby, so after it goes off pings are skipped for 20 s instead of bringing it back as on.
- A command latches the expected power (`withPowerLatch`): 3 s, or 20 s for power off without `PowerState`. While latched, reports that disagree are ignored, commands wait for the latch with `waitPowering()`, and another power command gets `TvPoweringError`. A failed action reverts the latch.
- Frame events take priority over SSDP for 2 s.
- Power on: port 8001 reachable → the TV is in standby, send `KEY_POWER` on the remote socket. Not reachable → the TV is fully off (deep sleep), send Wake-on-LAN.
- Power off: Frame with SmartThings → SmartThings; Frame without it → hold `KEY_POWER` 3.5 s (a short press only toggles Art Mode); other TVs → `KEY_POWER`.

## Inputs, switches, volume

- Inputs have a `type`: `app`, `input` (a source such as `HDMI1` or `dtv`, needs SmartThings), `command` or `artmode`. The selected input is found by checking Art Mode first, then the current input, then sources, then apps, 150 ms apart. Commands have nothing to read back, so the selection goes back to none (identifier 0) after 500 ms.
- An app counts as active when the REST API reports it `visible`. SmartThings reports an app as a channel name with a dot, which is not treated as a source, and ignores state older than 24 h.
- Custom switches combine options (`power`, `sleep`, `mute`, `volume`, `app`, `input`, `channel`, `picture_mode`, `sound_mode`, `command`), run in order. A switch wakes the TV only when `power` is set. Without it, turning it on while the TV is off turns it back off with a warning. Turning a switch off only acts on `mute` and `sleep`, the others have no matching TV action. A switch with nothing to read back (only `command`, `volume` or `power`) snaps back off after 500 ms.
- Command syntax (`lib/parsers.ts`): a comma list of keys, `KEY*3` repeats, `KEY*2.5s` holds, `DELAY*2s` pauses. Keys are sent 400 ms apart. `keys` in the config overrides the remote keys used in Control Center (`lib/remote.ts`).
- Channels use SmartThings when available, otherwise the digits and `KEY_ENTER`.
- The sleep timer runs inside the plugin (`setTimeout`). It is cleared on every power change and does not survive a Homebridge restart.
- Samsung TVs report mute when they go to standby, so mute switches and the volume slider stay off while the TV is off.
- Volume in HomeKit is absolute 0-100 (UPnP). The Control Center volume buttons send `KEY_VOLUP`/`KEY_VOLDOWN`. `Volume.Slider.Enable` adds a Lightbulb whose brightness is the volume and whose on/off follows mute, for scenes and automations. Changes to it while the TV is off are ignored.

## The Frame

- `frameSupport` comes from `FrameTVSupport` in device info. The Frame gets an Art Mode switch and a Power switch (each can be hidden with `Frame.ArtSwitch.Disable` / `Frame.PowerSwitch.Disable`).
- By default the TV tile means "on and not in Art Mode": turning it off enters Art Mode, turning it on leaves Art Mode, waking the TV first if it is fully off. `Frame.RealPowerMode` makes the tile control real power.
- Art Mode state comes from `artmode_status` / `get_artmode_status` replies (different firmwares send different ones) and `art_mode_changed` events, read in `FrameSocket.handleMessage`. It is asked for when the socket opens and on each poll, at most every 2.5 s.
- The art-app socket connects after `paired` and every time the TV turns on. It sends two events when it opens: `ms.channel.connect` when the connection is accepted, and `ms.channel.ready` when the Art app on the TV is running and can take requests. The plugin treats the socket as open on the first of the two. `CONNECTION_TIMEOUT` is 30 s.

### Known limitation: Art Mode after the TV was fully off

The Art app on the TV is what answers the art-app socket. `ms.channel.ready` only comes while the Art app is running.

When the Frame wakes from being fully off (deep sleep, woken by Wake-on-LAN), it starts on the last source it was on before it was turned off:

- **It was in Art Mode:** the TV starts in Art Mode, the Art app starts with it, and `ms.channel.ready` follows `ms.channel.connect`. Art Mode requests work.
- **It was on anything else** (an HDMI input, live TV, an app): the TV starts on that source and the Art app is not started. The socket still connects and the TV sends `ms.channel.connect`, but `ms.channel.ready` does not come, and the TV does not act on Art Mode requests sent over the socket, even though the connection is open.

What happens on an Art Mode request while the TV is fully off and was last on another source:

1. `DeviceController.setArtMode` sees the TV off and calls `powerOn()`, which sends Wake-on-LAN and latches power on for 3 s.
2. It waits for the latch (`waitPowering`), so HomeKit has already got success from the 2.5 s race.
3. The TV starts on its last source, not in Art Mode, so the Art app does not start.
4. `FrameSocket` connects, gets `ms.channel.connect` and sends `set_artmode_status`.
5. Without the Art app there is no `ms.channel.ready`, and the TV does not act on the request. Art Mode does not change, and nothing reports an error, because the request was sent on an open socket.

If the TV is still booting and cannot be reached when the latch ends, the connection fails instead. The request is lost the same way, because the error comes after the 2.5 s race.

This is how the TV behaves, not a plugin bug: whether Art Mode can be set right after a cold start depends on the source the TV was on when it was turned off. A connection that gets `ms.channel.connect` but no `ms.channel.ready` is not an authorization problem (that is `ms.channel.unauthorized`). Any fix must keep the 2.5 s answer to HomeKit and work across Frame models and firmware.

## HomeKit identity

- Each TV is published as an external accessory, so users add every TV in Home on its own, with the setup code from the log. Custom switches, the Frame switches and the volume slider are services of that same accessory.
- The accessory UUID comes from the MAC (+ optional `uuid`). Changing either makes it a new accessory in Home.
- Input and switch identifiers are a hash of their type and value (`lib/identifiers.ts`), not their name or position. Renaming or reordering keeps the HomeKit identity, changing an input's value or a switch's options gives it a new one. Changing the fingerprint itself changes every user's identifiers and breaks their scenes and automations.
- ActiveIdentifier 0 means "no input selected", so an identifier is never 0. `DisplayOrder` follows the order of the inputs in the config.

## Storage

- `samsung-tizen.json` in the Homebridge `accessories` folder holds per-device data (token, model, firmware, capabilities) and the SmartThings tokens. `Storage.get(id)` returns a Proxy that saves (debounced) on every change.
- The settings UI writes the `smartthings` entry, so that one is read back from disk (`reload`), the rest belongs to the plugin. The UI writes the file atomically, keeps the last 10 copies in `backups/samsung-tizen`, and moves an unreadable file aside as `.invalid.<time>`.
- `samsung-tizen-apps.json` holds the installed apps per TV, for the app list in the settings UI.

## Code style

- Comments explain why, not what, and are short. Match the comment density of the surrounding code.
- Prettier (`.prettierrc`, print width 180, sorted imports) and ESLint are the source of truth for formatting. Imports use the `.js` extension (ESM, `nodenext`).
- Keep the layering: protocols emit events, `Device` holds state, services read state and call `Device` methods.

## Workflow

- Commit messages are full sentences that say what changed and why (see `git log`).
- Do not edit `CHANGELOG.md` during feature work: the maintainer writes it at release. Homebridge UI shows the whole changelog from GitHub, not from npm.
- A GitHub release publishes to npm (`.github/workflows/release.yml`). A prerelease goes to the dist-tag named after it (`beta`, `debug`).
- Documentation: https://tavicu.github.io/homebridge-samsung-tizen/
- Issues are triaged by `.github/scripts/issue-triage.mjs` (OpenAI). Each dry run is a paid call. Issues with no activity are marked stale after 30 days and closed 5 days later.
