"use-strict";

// mongo and mongoosejs related requires

const mongoSanitize = require("mongo-sanitize");

const mongo = require('mongodb');
const { connect, Schema, model } = require('mongoose');

// nodejs requires

const DNS = require("dns");

// database schema and model definitions

/** this project needs a db !! **/
connect(process.env.DB_URI, { useUnifiedTopology: true, useNewUrlParser: true, useCreateIndex: true });

const urlSchema = new Schema({
    original_url: { type: String, required: true, unique: true },
    short_url: { type: String },
});

const Url = model("Url", urlSchema);

// function definitions
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

const getUrlFromDb = async function (response, encodedUrl) {
    const { original_url, short_url } = await Url
        .findOne({ original_url: encodedUrl })
        .exec();

    return response.json({
        original_url,
        short_url,
    });
};

const createNewEntryInDb = async function (response, encodedUrl) {
    const count = await Url
        .estimatedDocumentCount()
        .exec();

    const { original_url, short_url } = await Url.create({
        original_url: encodedUrl,
        short_url: count + 1,
    });

    return response.json({
        original_url,
        short_url,
    });
};

const newShortUrlHandler = async function (request, response) {
    try {
        const encodedUrl = encodeURI(request.body.url);

        const bool = await isUrlLive(encodedUrl);

        if (bool === false) {
            return response.json({
                error: "invalid URL",
            });
        }

        if (await Url.exists({ original_url: encodedUrl })) {
            return getUrlFromDb(response, encodedUrl);
        }

        return createNewEntryInDb(response, encodedUrl);

    } catch (error) {
        return response.json({
            error: "We cannot communicate with the database. Please, try again later"
        });
    }
};

const getUrlHandler = async function (request, response) {
    try {

        if (await Url.exists({ short_url: request.params.url })) {
            const entry = await Url
                .findOne({ short_url: request.params.url })
                .exec();

            return response.redirect(303, entry.original_url);
        }

        throw new Error("invalid url");
    } catch (error) {
        return response.json({
            error: error.message,
        });
    }
};

const runSanitizer = function (request, response, next) {
    request.body = mongoSanitize(request.body);
    next();
};

module.exports = {
    newShortUrlHandler,
    getUrlHandler,
    runSanitizer,
};
