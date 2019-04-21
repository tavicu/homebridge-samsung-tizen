const INTERVALS = {
    main: {
        default: 1000 * 10,
        min: 500
    },
    switch: {
        default: 1000 * 30,
        min: 1000
    }
};

module.exports = function(config) {
    let output = {};

    for (let key in INTERVALS) {
        let value;

        if (typeof config.refresh === 'object' && config.refresh.hasOwnProperty(key)) {
            value = config.refresh[key] === false ? false : config.refresh[key];
        } else if (typeof config.refresh === 'number') {
            value = config.refresh;
        }

        if (value === false) {
            output[key] = false;
        } else {
            output[key] = isNaN(value) ? INTERVALS[key].default : (value < INTERVALS[key].min ? INTERVALS[key].min : value);
        }
    }

    return output;
}