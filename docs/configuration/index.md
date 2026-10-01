# Examples

::: tip
Assign a **static IP address** to each TV on your router before you add it.
:::

::: warning Subnet
Samsung TVs do not allow WebSocket connections across subnets or VLANs. The TV has to be on the same subnet as Homebridge.
:::

`inputs`, `switches` and `keys` can be set once on the platform. Every TV inherits them. A list set on a device replaces the platform list for that TV.

`clientId` and `clientSecret` belong on the platform. `deviceId` belongs on each TV. See [SmartThings](/configuration/smartthings-api.md).

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

`inputs`, `switches`, and `keys` below apply to both TVs. Each TV still has its own `deviceId`.

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

### Device with its own inputs

The bedroom TV uses only the input in its own list. The living room TV uses the platform input.

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

Every field is described on the [device settings](/configuration/device-settings.md) page.
