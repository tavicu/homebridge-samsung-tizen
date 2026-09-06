import { promises as fs } from 'fs';
import path from 'path';
import { deepmerge } from 'deepmerge-ts';
import { API, Logging } from 'homebridge';
import { retry } from './tools.js';

export class Storage {
  private filePath: string;
  private accessories: Record<string, any> = {};
  private saveTimeout: NodeJS.Timeout | null = null;
  private lastKnownMtime: number = 0;

  constructor(
    api: API,
    private log: Logging,
  ) {
    this.filePath = path.join(api.user.cachedAccessoryPath(), 'samsung-tizen.json');
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
    } catch {
      this.accessories = {};
    }
  }

  /**
   * Returns a proxied storage object for a specific device ID.
   * Any property mutation will automatically schedule a debounced save operation.
   */
  get<T = any>(id: string): T & { clear(): void } {
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

        return obj[prop];
      },

      set: (obj, prop, value) => {
        if (prop === 'clear') {
          return false;
        }

        obj[prop] = value;
        this.save();
        return true;
      },
    }) as unknown as T & { clear(): void };
  }

  /**
   * Schedules an asynchronous write operation.
   * Debounces consecutive calls within 50ms to prevent file corruption from multiple devices.
   */
  private save(): void {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }

    this.saveTimeout = setTimeout(() => {
      this.write();
    }, 100);
  }

  /**
   * Checks if the file has been modified by the UI and makes a deep merge if needed.
   * Any errors (e.g. file not found on first run) are caught silently.
   */
  private async syncChanges(): Promise<void> {
    try {
      const currentStats = await fs.stat(this.filePath);

      if (currentStats.mtimeMs > this.lastKnownMtime) {
        const diskData = await fs.readFile(this.filePath, 'utf-8');
        const parsedData = JSON.parse(diskData);

        this.accessories = deepmerge(parsedData, this.accessories);

        this.lastKnownMtime = currentStats.mtimeMs;
      }
    } catch {}
  }

  /**
   * Performs the actual file write with a recursive retry mechanism.
   */
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
}
