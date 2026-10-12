import { Device } from '../device/index.js';

type CacheEntry<T> = {
  promise?: Promise<T>;
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

    if (entry?.promise) {
      return entry.promise;
    }

    if (entry?.expire && Date.now() < entry.expire) {
      return Promise.resolve(entry.value as T);
    }

    const promise = run()
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

    this.keys[key] = { promise };

    return promise;
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
