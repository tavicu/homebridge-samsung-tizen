import { Device } from '../device/index.js';

export class Cache {
  private keys: Record<string, any> = {};

  constructor(device: Device) {
    device.on('state:update', () => this.flush());
  }

  public get(key: string, run: any = Promise.resolve.bind(Promise), time = 500) {
    if (this.keys[key] && Date.now() < this.keys[key].expire) {
      return Promise.resolve(this.keys[key].value);
    }

    // If we already have one caching
    // in progress try again in 100 ms
    if (this.keys[key] && this.keys[key].fetching) {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          this.get(key, run, time).then(resolve).catch(reject);
        }, 100);
      });
    }

    this.keys[key] = {
      fetching: true,
    };

    return run()
      .then((value: any) => {
        this.keys[key] = {
          value: value,
          expire: Date.now() + time,
        };

        return value;
      })
      .catch((error: any) => {
        delete this.keys[key];
        throw error;
      });
  }

  public forget(key: string): Cache {
    delete this.keys[key];

    return this;
  }

  public flush(): Cache {
    this.keys = {};

    return this;
  }
}
