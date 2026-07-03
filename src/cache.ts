import { Device } from './device/index.js';

export class Cache {
  private keys: object = {};

  constructor(device: Device) {
    device.on('state.change', () => this.flush());
  }

  get(key: string, run: any = Promise.resolve.bind(Promise), time = 500) {
    if (this.keys[key] && Date.now() < this.keys[key].expire) {
      return Promise.resolve(this.keys[key].value);
    }

    // If we already have one caching
    // in progress try again in 100 ms
    if (this.keys[key] && this.keys[key].fetching) {
      return new Promise((resolve) => setTimeout(() => resolve(this.get(key, run, time)), 100));
    }

    this.keys[key] = {
      fetching: true,
    };

    return run().then((value) => {
      this.keys[key] = {
        value: value,
        expire: Date.now() + time,
      };

      return value;
    });
  }

  forget(key: string): Cache {
    delete this.keys[key];

    return this;
  }

  flush(): Cache {
    this.keys = {};

    return this;
  }
}
