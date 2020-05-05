"use-strict";

const mongo = require('mongodb');
const { connect, Schema, model } = require('mongoose');

// database schema and model definitions

/** this project needs a db !! **/
connect(process.env.DB_URI, { useUnifiedTopology: true, useNewUrlParser: true, useCreateIndex: true });

const urlSchema = new Schema({
    original_url: { type: String, required: true, unique: true },
    short_url: { type: String },
});

const Url = model("Url", urlSchema);

module.exports = {
    urlModel: Url,
};