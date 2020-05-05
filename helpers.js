"use-strict";
/** @module helpers.js */

// imports 

/**
 * @module mongoSanitize
 *
 * @see https://www.npmjs.com/package/mongo-sanitize
 */
const mongoSanitize = require("mongo-sanitize");

/**
 * @module DNS
 * 
 * @see https://nodejs.org/api/dns.html
 */
const DNS = require("dns");

/**
 * @module crypto
 * 
 * @see https://nodejs.org/api/crypto.html
 */
const crypto = require("crypto");

/**
 * @constant urlModel The model of the database
 */
const { urlModel } = require("./model");

// function definitions
/**
 * Consumes the request and response objects
 * and then passes in them to the next function
 * 
 * @see https://expressjs.com/en/guide/using-middleware.html#middleware.application
 * 
 * @param {Request} request An Express Request object
 * @param {Response} response An Express Response object
 * @param {Function} next an Express middleware function
 * @returns {void}
 */
const runSanitizer = function (request, response, next) {
    request.body = mongoSanitize(request.body);
    next();
};

/**
 * consumes a url and returns true if the given url
 * is that of a live website; otherwise, 
 * it returns false.
 * 
 * @see https://nodejs.org/api/dns.html#dns_dns_resolve_hostname_rrtype_callback
 * 
 * @param {String|URL} url 
 * @returns {boolean}
 */
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

/**
 * Consumes a response, a url and a model, and returns
 * a JSON response
 * 
 * @see https://mongoosejs.com/docs/api/model.html
 * 
 * @param {Response} response An Express Response object
 * @param {String} url 
 * @param {Model} model A Mongoose Model object
 * @returns {String} a stringified JSON object
 */
const getUrlFromDb = async function (response, url, model) {
    const { original_url, short_url } = await model
        .findOne({ original_url: url })
        .exec();

    return response.json({
        original_url,
        short_url,
    });
};

/**
 * Consumes a response, a url and a model, and returns
 * a JSON response
 * 
 * @see https://nodejs.org/api/crypto.html#crypto_crypto_randombytes_size_callback
 * @see https://mongoosejs.com/docs/api/model.html#model_Model.create
 * 
 * @param {Response} response An ExpressJS Response object
 * @param {String} url 
 * @param {Model} model A MongooseJS Model object
 * @returns {String} A stringified JSON object
 */
const createNewEntryInDb = async function (response, url, model) {
    // an alphanumeric string of 12 characters length
    const hash = crypto.randomBytes(6).toString("hex");

    const { original_url, short_url } = await model.create({
        original_url: url,
        short_url: hash,
    });

    return response.json({
        original_url,
        short_url,
    });
};

/**
 * Consumes a MongooseJS model and returns 
 * a POST request handler
 * 
 * @param {Model} model 
 * @returns {Function} an async function
 */
const newShortUrlHandlerFactory = function (model) {
    /**
     * handles a request of the client and returns a response
     * in JSON
     * 
     * @see https://mongoosejs.com/docs/api/model.html#model_Model.exists
     *  
     * @param {Request} request An ExpressJS Request object
     * @param {Response} response An Express JS Response object
     * @returns {String} A stringified JSON response
     */
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

/**
 * Consumes a database model and returns a GET request handler
 * 
 * @param {Model} model A MongooseJS Model object
 * @returns {Function} an async function
 */
const getUrlHandlerFactory = function (model) {
    /**
     * handles a request of the client and returns a response
     * in JSON
     * 
     * @param {Request} request An ExpressJS Request object
     * @param {Response} response An ExpressJS Response object
     * @returns {String} A stringified JSON object
     */
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

/**
 * @exports helpers
 */
module.exports = {
    newShortUrlHandler: newShortUrlHandlerFactory(urlModel),
    getUrlHandler: getUrlHandlerFactory(urlModel),
    runSanitizer,
};
