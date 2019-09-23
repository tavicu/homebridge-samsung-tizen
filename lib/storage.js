let path = require('path');
let fs   = require('fs-extra')

module.exports = class Storage {
    constructor(api) {
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
        fs.writeJson(this.filePath, this.accessories);
    }
}