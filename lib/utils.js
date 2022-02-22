/**
 * Promise with delay
 * @param {number} timeout
 * @param {object} options
 * @returns {Promise}
 */
exports.delay = (timeout = 150, {value} = {}) => {
    return new Promise(resolve => {
        settle = () => resolve(value);

        setTimeout(settle, timeout);
    });
}

/**
 * Promise with a timeout
 * @param {Promise} promise
 * @param {number} timeout
 * @returns {Promise}
 */
exports.race = (promise, timeout = 2500) => {
    const race = new Promise(resolve => setTimeout(resolve, timeout));

    return Promise.race([promise, race]);
}

/**
 * Postpone execution until after wait milliseconds
 * have elapsed since the last time it was invoked
 * @param {Function} func
 * @param {number} wait
 * @returns {Function}
 */
exports.debounce = (func, wait = 500) => {
    let timeout, previous, args, context, resolves = [];

    let later = function() {
        let passed = Date.now() - previous;

        if (wait > passed) {
            timeout = setTimeout(later, wait - passed);
        } else {
            let result = func.apply(context, args);
            resolves.forEach(r => r(result));
            timeout = args = context = null;
            resolves = [];
        }
    };

    return function(..._args) {
        context = this;
        args = _args;
        previous = Date.now();

        if (!timeout) {
            timeout = setTimeout(later, wait);
        }

        return new Promise(resolve => resolves.push(resolve));
    }
}