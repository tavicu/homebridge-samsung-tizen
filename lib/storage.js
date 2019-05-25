let path = require('path');
let fs   = require('fs-extra')

module.exports = class Storage {
    constructor(api) {
        this.filePath = path.join(api.user.cachedAccessoryPath(), 'samsung-tizen.json');
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

    get(uuid) {
        if (!this.accessories) {
            this.accessories = {};
        }

        if (!this.accessories[uuid]) {
            this.accessories[uuid] = {};
        }

        return this.accessories[uuid];
    }

    save() {
        fs.writeJson(this.filePath, this.accessories);
    }
}