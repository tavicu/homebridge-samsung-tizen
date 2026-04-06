import * as ssdp from 'peer-ssdp';

import { debounce } from '../tools';
import { SamsungPlatform } from '../platform';

type Headers = {
    ST: string;
    NT: string;
    NTS: string;
    LOCATION: string;
};

type Address = {
    address: string;
};

export class SSDP {
    private addresses: Array<string> = [];
    private events: object = {};

    private readonly peer: any; // eslint-disable-line
    private readonly possibleEvents: Array<string> = [ssdp.ALIVE, ssdp.BYEBYE];

    constructor(private readonly platform: SamsungPlatform) {
        this.peer = ssdp.createPeer();

        this.peer.on('ready', this.search.bind(this));
        this.peer.on('notify', this.onNotify.bind(this));
        this.peer.on('found', this.onFound.bind(this));

        // Close connection when server is stopping
        ['SIGINT', 'SIGTERM'].forEach((signal) => process.on(signal, () => this.destroy()));
    }

    start() {
        this.platform.devices.forEach((device) => {
            const { config } = device;

            this.addresses.push(config.ip);

            this.events[config.ip] = debounce((event: string) => {
                if (this.possibleEvents.includes(event)) {
                    console.log('send event', event, device.config.ip); // eslint-disable-line
                    device.emit(ssdp.UPDATE, event);
                }
            });
        });

        this.peer.start();
    }

    search() {
        this.peer.search({
            ST: 'upnp:rootdevice',
        });
    }

    private onNotify(headers: Headers, address: Address) {
        // Filter response to devices
        if (headers.NT !== 'upnp:rootdevice' || !this.addresses.includes(address.address)) {
            return;
        }

        // Send received event
        this.events[address.address](headers.NTS);
    }

    private onFound(headers: Headers, address: Address) {
        // Filter response to devices
        if (headers.ST !== 'upnp:rootdevice' || !this.addresses.includes(address.address)) {
            return;
        }

        // Send alive event
        this.events[address.address](ssdp.ALIVE);
    }

    private destroy() {
        if (this.peer.stopInterfaceDisco) {
            this.peer.close();
        }
    }
}
