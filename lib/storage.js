let path = require('path');
let fs   = require('fs-extra');

module.exports = class Storage {
    constructor(api) {
        this.saving      = false;
        this.accessories = {};
        this.filePath    = path.join(api.user.cachedAccessoryPath(), 'samsung-tizen.json');
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
        if (this.saving) {
            return new Promise(resolve => setTimeout(() => resolve(this.save()), 100));
        }

        this.saving = true;

        return fs.writeJson(this.filePath, this.accessories, () => {
            this.saving = false;
        });
    }
}