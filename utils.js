const base64Encode = function(string) {
    return new Buffer(string).toString('base64');
};

module.exports = { base64Encode };