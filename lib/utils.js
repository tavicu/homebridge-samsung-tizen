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