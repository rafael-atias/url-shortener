const DNS = require("dns");

const isUrlLive = function (url) {
    return new Promise(function (resolve, reject) {
        const u = (typeof url === "string") ? new URL(url) : url;

        DNS.resolve(u.hostname, function (error, data) {
            if (error) {
                return reject(error);
            }

            return resolve(data);
        });
    }).then(function (data) {
        return true;
    }).catch(function (error) {
        return false;
    })
};

module.exports = {
    isUrlLive,
};
