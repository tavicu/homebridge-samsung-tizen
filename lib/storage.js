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
        if (this.accessories && this.accessories[uuid]) {
            return this.accessories[uuid];
        }

        return {};
    }

    set(uuid, value) {
        this.accessories[uuid] = value;

        fs.writeJson(this.filePath, this.accessories);
    }

    getValue(uuid, key) {
        return this.get(uuid)[key];
    }

    setValue(uuid, key, value) {
        let accessory = this.get(uuid);

        if (value === null) {
            delete accessory[key];
        } else {
            accessory[key] = value;
        }

        this.set(uuid, accessory);
    }
}