const REFRESH_INTERVAL     = 1000 * 30;
const REFRESH_MIN_INTERVAL = 1000;

module.exports = function(config) {

    function getInterval(option) {
        let interval = REFRESH_INTERVAL;

        if (typeof config.refresh === 'object' && config.refresh.hasOwnProperty(option)) {
            if (config.refresh[option] === false) {
                return false;
            }

            interval = config.refresh[option];
        }

        if (typeof config.refresh === 'number') {
            interval = config.refresh;
        }

        return isNaN(interval) ? REFRESH_INTERVAL : (interval < REFRESH_MIN_INTERVAL ? REFRESH_MIN_INTERVAL : interval);
    }

    return {
        main: getInterval('main'),
        switch: getInterval('switch')
    }
}