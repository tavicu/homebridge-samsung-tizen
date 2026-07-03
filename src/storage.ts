import path from 'path';
import fs from 'fs-extra';

import { API } from 'homebridge';

export class Storage {
  private dirPath: string;
  private filePath: string;
  private accessories: object = {};

  constructor(api: API) {
    this.dirPath = api.user.cachedAccessoryPath();
    this.filePath = path.join(this.dirPath, 'samsung-tizen.json');

    fs.ensureDir(this.dirPath);
  }

  async initialize() {
    await fs
      .readJson(this.filePath)
      .catch(() => ({}))
      .then((accessories: object) => (this.accessories = accessories));
  }

  get(id: string): object {
    if (!this.accessories[id]) {
      this.accessories[id] = {};
    }

    return this.accessories[id];
  }

  save() {
    return fs.writeJsonSync(this.filePath, this.accessories);
  }
}
