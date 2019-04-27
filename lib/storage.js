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

    getValue(uuid, key) {
        return this._get(uuid)[key];
    }

    setValue(uuid, key, value) {
        let accessory = this._get(uuid);

        if (value === null) {
            delete accessory[key];
        } else {
            accessory[key] = value;
        }

        this._set(uuid, accessory);
    }

    _get(uuid) {
        if (this.accessories && this.accessories[uuid]) {
            return this.accessories[uuid];
        }

        return {};
    }

    _set(uuid, value) {
        this.accessories[uuid] = value;

        fs.writeJson(this.filePath, this.accessories);
    }
}