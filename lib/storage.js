let path = require('path');
let fs   = require('fs-extra');

module.exports = class Storage {
    constructor(api) {
        this.accessories = {};
        this.dirPath     = api.user.cachedAccessoryPath();
        this.filePath    = path.join(this.dirPath, 'samsung-tizen.json');

        fs.ensureDir(this.dirPath);
    }

    init() {
        return new Promise(resolve => {
            fs.readJson(this.filePath)
                .then(accessories => resolve(accessories))
                .catch(() => resolve({}));
        }).then(accessories => {
            this.accessories = accessories;
        });
    }

    get(id) {
        if (!this.accessories) {
            this.accessories = {};
        }

        if (!this.accessories[id]) {
            this.accessories[id] = {};
        }

        return this.accessories[id];
    }

    save() {
        return fs.writeJsonSync(this.filePath, this.accessories);
    }
}