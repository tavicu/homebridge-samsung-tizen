import { Device } from '../device/index.js';

type CacheEntry<T> = {
  fetching?: boolean;
  value?: T;
  expire?: number;
};

export class Cache {
  private keys: Record<string, CacheEntry<unknown>> = {};

  constructor(device: Device) {
    device.on('state:update', (prop) => prop === 'power' && this.flush());
  }

  public get<T>(key: string, run: () => Promise<T>, time = 500): Promise<T> {
    const entry = this.keys[key] as CacheEntry<T> | undefined;

    if (entry && entry.expire && Date.now() < entry.expire) {
      return Promise.resolve(entry.value as T);
    }

    // If we already have one caching
    // in progress try again in 100 ms
    if (entry?.fetching) {
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
      .then((value) => {
        this.keys[key] = {
          value,
          expire: Date.now() + time,
        };

        return value;
      })
      .catch((error) => {
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
