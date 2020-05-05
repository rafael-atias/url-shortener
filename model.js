"use-strict";

/**
 * @function connect - opens a connection to the database
 * @see https://mongoosejs.com/docs/api/mongoose.html#mongoose_Mongoose-connect
 * 
 * @function Schema - The MongooseJS Schema constructor
 * @see https://mongoosejs.com/docs/api/mongoose.html#mongoose_Mongoose-Schema
 * 
 * @function model - The factory function to define a MongooseJS model
 * @see https://mongoosejs.com/docs/api/mongoose.html#mongoose_Mongoose-model
 * 
 */
const { connect, Schema, model } = require('mongoose');


connect(process.env.DB_URI, { useUnifiedTopology: true, useNewUrlParser: true, useCreateIndex: true });

/**
 * The schema for a url in the database 
 * 
 * @constant urlSchema
 */
const urlSchema = new Schema({
    original_url: { type: String, required: true, unique: true },
    short_url: { type: String },
});

/**
 * The model for urls in the database
 * 
 * @constant Url
 */
const Url = model("Url", urlSchema);

module.exports = {
    urlModel: Url,
};