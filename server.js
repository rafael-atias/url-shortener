'use strict';

// imports

const express = require('express');
const mongo = require('mongodb');
const { connect, Schema, model } = require('mongoose');

const cors = require('cors');

const app = express();

const bodyParser = require("body-parser");

const { isUrlLive } = require("./helpers");

// Basic Configuration 
const port = process.env.PORT || 3000;

/** this project needs a db !! **/
connect(process.env.DB_URI, { useUnifiedTopology: true, useNewUrlParser: true, useCreateIndex: true });

const urlSchema = new Schema({
  original_url: { type: String, required: true, unique: true },
  short_url: { type: String },
});

const Url = model("Url", urlSchema);

app.use(cors());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here
app.use(bodyParser.urlencoded({ extended: false }));

app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function (req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});


app.post("/api/shorturl/new", async function (request, response) {
  try {
    const bodyUrl = encodeURI(request.body.url);

    const bool = await isUrlLive(bodyUrl);

    if (bool === false) {
      return response.json({
        error: "invalid URL",
      });
    }

    if (await Url.exists({ original_url: bodyUrl })) {
      const entry = await Url
        .findOne({ original_url: bodyUrl })
        .exec();

      return response.json({
        original_url: entry.original_url,
        short_url: entry.short_url,
      });
    }

    const count = await Url
      .estimatedDocumentCount()
      .exec();

    const entry = await Url.create({
      original_url: bodyUrl,
      short_url: count + 1,
    });

    return response.json({
      original_url: entry.original_url,
      short_url: entry.short_url
    });

  } catch (error) {
    return response.json({
      error: "We cannot communicate with the database. Please, try again later"
    });
  }
});

app.get("/api/shorturl/:url", async function (request, response) {
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
});

app.listen(port, function () {
  console.log(`Node.js listening on port ${port}`);
});