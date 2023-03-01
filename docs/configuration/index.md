# Examples

::: tip
Before adding your devices make sure to assign a **static IP address** for each device on your router.
:::

::: warning Subnet/VLAN
Samsung TVs does not allow WebSocket connections across different subnets or VLANs. If your TV is not on the same subnet as Homebridge server it will fail to connect.
:::

### Basic configuration

``` json
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

``` json
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

### Advanced configuration with all settings

``` json
"platforms": [
    {
        "platform": "SamsungTizen",
        "devices": [
            {
                "name": "Bedroom TV",
                "ip": "10.20.30.40",
                "mac": "A0:B1:C2:D3:E4:F5",
                "uuid": "a1",
                "api_key": "e2c3de7e-05e2-4690-8ee7-8d4355f992b9",
                "device_id": "5d9215vx-c421-412-a998-c4ec48754f08",
                "inputs": [
                    {"name": "Netflix", "type": "app", "value": "11101200001"}
                ],
                "switches": [
                    {"name": "Sleep", "sleep": 60}
                ],
                "keys": {
                    "SELECT": "KEY_ENTER"
                },
                "delay": 400,
                "refresh": {
                    main: 5000,
                    switch: 30000
                }
            }
        ]
    }
]
```

### Configuration with same settings for multiple TVs

Some of the settings can be set as main and they will apply for every device so you will not have to duplicate them for each device.

In the folowing example `api_key`, `delay`, `refresh`, `inputs`, `switches` and `keys` will apply to both TVs.

``` json
"platforms": [
    {
        "platform": "SamsungTizen",
        "api_key": "e2c3de7e-05e2-4690-8ee7-8d4355f992b9",
        "delay": 400,
        "refresh": {
            main: 5000,
            switch: 30000
        },
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
                "device_id": "5d9215vx-c421-412-a998-c4ec48754f08"
            },
            {
                "name": "Living Room TV",
                "ip": "10.20.30.41",
                "mac": "A0:B1:C2:D3:E4:F6",
                "device_id": "5d9215vx-a998-412-c421-c4ce52121s12"
            }
        ]
    }
]
```