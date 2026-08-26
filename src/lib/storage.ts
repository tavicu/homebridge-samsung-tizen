import { promises as fs } from 'fs';
import path from 'path';
import { deepmerge } from 'deepmerge-ts';
import { API, Logging } from 'homebridge';
import { sleep } from './tools.js';

export class Storage {
  private filePath: string;
  private accessories: Record<string, any> = {};
  private saveTimeout: NodeJS.Timeout | null = null;
  private lastKnownMtime: number = 0;

  // Storage configuration for retries
  private readonly maxRetries = 3;
  private readonly retryDelay = 100; // in milliseconds

  constructor(
    api: API,
    private log: Logging,
  ) {
    this.filePath = path.join(api.user.cachedAccessoryPath(), 'samsung-tizen.json');
  }

  async initialize(): Promise<void> {
    try {
      // Ensure the directory exists (native replacement for ensureDir)
      await fs.mkdir(path.dirname(this.filePath), { recursive: true });

      const stats = await fs.stat(this.filePath);
      this.lastKnownMtime = stats.mtimeMs;

      const data = await fs.readFile(this.filePath, 'utf-8');
      this.accessories = JSON.parse(data);
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
      this.write(this.maxRetries, this.retryDelay);
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
  private async write(retries: number, delay: number): Promise<void> {
    try {
      // Check if file has been modified
      await this.syncChanges();

      // Write file with new details
      await fs.writeFile(this.filePath, JSON.stringify(this.accessories, null, 2), 'utf-8');

      // Update last known modification time
      const newStats = await fs.stat(this.filePath);
      this.lastKnownMtime = newStats.mtimeMs;
    } catch (error) {
      if (retries > 1) {
        this.log.warn(`[Storage] Failed to save cache. Retrying in ${delay}ms... (${retries - 1} attempts left)`);

        await sleep(delay);
        return this.write(retries - 1, delay * 2);
      } else {
        this.log.error('[Storage] Could not save cache file:', error);
      }
    }
  }
}
