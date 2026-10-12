import { promises as fs } from 'fs';
import path from 'path';
import { API, Logging } from 'homebridge';
import { retry } from './tools.js';

// Entries written by the configuration interface (SmartThings authorization). The copy on disk wins for these.
const UI_OWNED_KEYS = ['smartthings'];

const replaceContents = (target: Record<string, any>, source: Record<string, any> = {}): void => {
  for (const key of Object.keys(target)) {
    delete target[key];
  }

  Object.assign(target, source);
};

export class Storage {
  private filePath: string;
  private appsPath: string;
  private accessories: Record<string, any> = {};
  private apps: Record<string, unknown[]> = {};
  private saveTimeout: NodeJS.Timeout | null = null;
  private appsSaveTimeout: NodeJS.Timeout | null = null;
  private writeQueue: Promise<void> = Promise.resolve();
  private appsWriteQueue: Promise<void> = Promise.resolve();
  private lastKnownMtime: number = 0;

  constructor(
    api: API,
    private log: Logging,
  ) {
    const cachePath = api.user.cachedAccessoryPath();

    this.filePath = path.join(cachePath, 'samsung-tizen.json');
    this.appsPath = path.join(cachePath, 'samsung-tizen-apps.json');
  }

  async initialize(): Promise<void> {
    try {
      await fs.mkdir(path.dirname(this.filePath), { recursive: true });

      await retry(
        async () => {
          const stats = await fs.stat(this.filePath);
          this.lastKnownMtime = stats.mtimeMs;

          const data = await fs.readFile(this.filePath, 'utf-8');
          this.accessories = JSON.parse(data);
        },
        { retries: 1, delay: 500 },
      );
    } catch {}

    try {
      this.apps = JSON.parse(await fs.readFile(this.appsPath, 'utf-8'));
    } catch {}
  }

  /**
   * Returns a proxied storage object for a specific device ID.
   * Any property mutation will automatically schedule a debounced save operation.
   */
  get<T = any>(id: string): T & { clear(): void; reload(): Promise<void> } {
    if (!this.accessories[id]) {
      this.accessories[id] = {};
    }

    return new Proxy(this.accessories[id], {
      get: (obj, prop) => {
        if (prop === 'clear') {
          return () => {
            for (const key of Object.keys(obj)) {
              delete obj[key];
            }

            this.save();
          };
        }

        // Picks up changes written by the configuration interface.
        if (prop === 'reload') {
          return () => this.syncChanges();
        }

        return obj[prop];
      },

      set: (obj, prop, value) => {
        if (prop === 'clear' || prop === 'reload') {
          return false;
        }

        if (obj[prop] === value) {
          return true;
        }

        obj[prop] = value;
        this.save();
        return true;
      },
    }) as unknown as T & { clear(): void; reload(): Promise<void> };
  }

  private save(): void {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }

    this.saveTimeout = setTimeout(() => {
      this.writeQueue = this.writeQueue.then(() => this.write());
    }, 100);
  }

  /**
   * Checks if the file has been modified by the UI and merges it into memory if needed.
   * Any errors (e.g. file not found on first run) are caught silently.
   */
  private async syncChanges(): Promise<void> {
    try {
      const currentStats = await fs.stat(this.filePath);

      if (currentStats.mtimeMs > this.lastKnownMtime) {
        const diskData = await fs.readFile(this.filePath, 'utf-8');
        const parsedData = JSON.parse(diskData);

        this.mergeFromDisk(parsedData);

        this.lastKnownMtime = currentStats.mtimeMs;
      }
    } catch {}
  }

  /**
   * The configuration interface only writes the UI-owned entries (SmartThings authorization),
   * so those are taken from disk. Merged in place so the proxies from get() stay attached.
   */
  private mergeFromDisk(diskData: Record<string, any>): void {
    for (const id of UI_OWNED_KEYS) {
      if (this.accessories[id]) {
        replaceContents(this.accessories[id], diskData[id]);
      } else if (diskData[id]) {
        this.accessories[id] = diskData[id];
      }
    }
  }

  private async write(): Promise<void> {
    try {
      await retry(
        async () => {
          await this.syncChanges();
          await fs.writeFile(this.filePath, JSON.stringify(this.accessories, null, 2), 'utf-8');

          const newStats = await fs.stat(this.filePath);
          this.lastKnownMtime = newStats.mtimeMs;
        },
        { retries: 3, delay: 100 },
      );
    } catch (error) {
      this.log.error('[Storage] Could not save cache file:', error);
    }
  }

  saveApps(mac: string, apps: unknown[]): void {
    this.apps[mac.trim().toLowerCase()] = apps;

    if (this.appsSaveTimeout) {
      clearTimeout(this.appsSaveTimeout);
    }

    this.appsSaveTimeout = setTimeout(() => {
      this.appsWriteQueue = this.appsWriteQueue.then(() => this.writeApps());
    }, 100);
  }

  private async writeApps(): Promise<void> {
    try {
      await retry(() => fs.writeFile(this.appsPath, JSON.stringify(this.apps), 'utf-8'), { retries: 1, delay: 100 });
    } catch (error) {
      this.log.error('[Storage] Could not save apps file:', error);
    }
  }
}
