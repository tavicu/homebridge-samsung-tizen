# Examples

The settings screen in Homebridge UI writes the config for you. These examples show what it looks like in `config.json`. Every key is described on the [Settings](/configuration/device-settings.md) page.

::: tip
Assign a **static IP address** to each TV on your router before you add it.
:::

::: warning Subnet
Samsung TVs do not allow WebSocket connections across subnets or VLANs. The TV has to be on the same subnet as Homebridge.
:::

`inputs`, `switches` and `keys` can be set once on the platform, and every TV gets them. Inputs and switches set on a TV are added on top of the platform ones. A key set on a TV replaces the same key from the platform.

`clientId` and `clientSecret` belong on the platform. `deviceId` belongs on each TV. See [SmartThings integration](/smartthings/index.md).

### Basic configuration

```json
"platforms": [
    {
        "platform": "SamsungTizen",
        "devices": [
            {
                "name": "Bedroom TV",
                "ip": "10.20.30.40",
                "mac": "A0:B1:C2:D3:E4:F5"
            }
        ]
    }
]
```

### Configuration with multiple TVs

```json
"platforms": [
    {
        "platform": "SamsungTizen",
        "devices": [
            {
                "name": "Bedroom TV",
                "ip": "10.20.30.40",
                "mac": "A0:B1:C2:D3:E4:F5"
            },
            {
                "name": "Living Room TV",
                "ip": "10.20.30.41",
                "mac": "A0:B1:C2:D3:E4:F6"
            }
        ]
    }
]
```

### Same settings for every TV

The `inputs`, `switches` and `keys` below apply to both TVs. Each TV still has its own `deviceId`.

```json
"platforms": [
    {
        "platform": "SamsungTizen",
        "clientId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
        "clientSecret": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
        "inputs": [
            {"name": "Netflix", "type": "app", "value": "11101200001"}
        ],
        "switches": [
            {"name": "Sleep", "sleep": 60}
        ],
        "keys": {
            "SELECT": "KEY_ENTER"
        },
        "devices": [
            {
                "name": "Bedroom TV",
                "ip": "10.20.30.40",
                "mac": "A0:B1:C2:D3:E4:F5",
                "deviceId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
            },
            {
                "name": "Living Room TV",
                "ip": "10.20.30.41",
                "mac": "A0:B1:C2:D3:E4:F6",
                "deviceId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
            }
        ]
    }
]
```

### Extra inputs on one TV

Both TVs get Netflix from the platform. The bedroom TV also gets YouTube from its own list.

```json
"platforms": [
    {
        "platform": "SamsungTizen",
        "inputs": [
            {"name": "Netflix", "type": "app", "value": "11101200001"}
        ],
        "devices": [
            {
                "name": "Bedroom TV",
                "ip": "10.20.30.40",
                "mac": "A0:B1:C2:D3:E4:F5",
                "inputs": [
                    {"name": "YouTube", "type": "app", "value": "111299001912"}
                ]
            },
            {
                "name": "Living Room TV",
                "ip": "10.20.30.41",
                "mac": "A0:B1:C2:D3:E4:F6"
            }
        ]
    }
]
```

### Different key on one TV

The Information button opens the menu (`KEY_MENU`) on every TV. On the living room TV it opens the home screen (`KEY_HOME`) instead. All the other buttons keep their default.

```json
"platforms": [
    {
        "platform": "SamsungTizen",
        "keys": {
            "INFORMATION": "KEY_MENU"
        },
        "devices": [
            {
                "name": "Bedroom TV",
                "ip": "10.20.30.40",
                "mac": "A0:B1:C2:D3:E4:F5"
            },
            {
                "name": "Living Room TV",
                "ip": "10.20.30.41",
                "mac": "A0:B1:C2:D3:E4:F6",
                "keys": {
                    "INFORMATION": "KEY_HOME"
                }
            }
        ]
    }
]
```
