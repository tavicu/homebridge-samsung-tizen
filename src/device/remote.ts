// import fetch from 'node-fetch';
// import timeoutSignal from 'timeout-signal';
import isPortReachable from 'is-port-reachable';

import { Device } from './device.js';

// import { TvOfflineError } from '../errors';

export class Remote {
  constructor(public device: Device) {}

  ping() {
    return isPortReachable(8001, {
      host: this.device.config.ip,
      timeout: 250,
    });
  }

  async info() {
    // if (!(await this.ping())) {
    //     throw new TvOfflineError();
    // }
    // const body = await fetch(`http://${this.device.config.ip}:8001/api/v2/`, {
    //     signal: timeoutSignal(500),
    // });
    // const data: any = await body.json();
    // if (data?.device) {
    //     this.device.storage['update'] = {
    //         frametv: data.device.FrameTVSupport === 'true',
    //         tokenauth: data.device.TokenAuthSupport === 'true',
    //         powerstate: data.device.PowerState !== undefined,
    //     };
    // }
    // return data;
  }
}
