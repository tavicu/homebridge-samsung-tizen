// import UPnPClient from 'node-upnp';

// import { Device } from '../device';

// export class UPnP {
//     private readonly client: UPnPClient;

//     constructor(public device: Device) {
//         this.device = device;

//         this.client = new UPnPClient({
//             url: `http://${device.config.ip}:9197/dmr`,
//         });
//     }

//     async getDescription() {
//         const description = await this.client.getDeviceDescription();
//         return description;
//     }
// }
