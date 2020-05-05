"use-strict";

// imports 

const mongoSanitize = require("mongo-sanitize");
const DNS = require("dns");

const { urlModel } = require("./model");

// function definitions

const runSanitizer = function (request, response, next) {
    request.body = mongoSanitize(request.body);
    next();
};

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

const getUrlFromDb = async function (response, encodedUrl, model) {
    const { original_url, short_url } = await model
        .findOne({ original_url: encodedUrl })
        .exec();

    return response.json({
        original_url,
        short_url,
    });
};

const createNewEntryInDb = async function (response, encodedUrl, model) {
    const count = await model
        .estimatedDocumentCount()
        .exec();

    const { original_url, short_url } = await model.create({
        original_url: encodedUrl,
        short_url: count + 1,
    });

    return response.json({
        original_url,
        short_url,
    });
};

const newShortUrlHandlerFactory = function (model) {
    return async function (request, response) {
        try {
            const encodedUrl = encodeURI(request.body.url);

            const bool = await isUrlLive(encodedUrl);

            if (bool === false) {
                return response.json({
                    error: "invalid URL",
                });
            }

            if (await model.exists({ original_url: encodedUrl })) {
                return getUrlFromDb(response, encodedUrl, model);
            }

            return createNewEntryInDb(response, encodedUrl, model);

        } catch (error) {
            return response.json({
                error: "We cannot communicate with the database. Please, try again later"
            });
        }
    };
};

const getUrlHandlerFactory = function (model) {
    return async function (request, response) {
        try {

            if (await model.exists({ short_url: request.params.url })) {
                const { original_url } = await model
                    .findOne({ short_url: request.params.url })
                    .exec();

                return response.redirect(303, original_url);
            }

            throw new Error("invalid url");
        } catch (error) {
            return response.json({
                error: error.message,
            });
        }
    };
};

module.exports = {
    newShortUrlHandler: newShortUrlHandlerFactory(urlModel),
    getUrlHandler: getUrlHandlerFactory(urlModel),
    runSanitizer,
};
