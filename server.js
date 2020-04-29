'use strict';

var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');

var cors = require('cors');

var app = express();

const bodyParser = require("body-parser");

const { isUrlLive } = require("./helpers");

// Basic Configuration 
var port = process.env.PORT || 3000;

/** this project needs a db !! **/
// mongoose.connect(process.env.DB_URI);

app.use(cors());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here
app.use(bodyParser.urlencoded({ extended: false }));

app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function (req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});


// your first API endpoint... 
app.post("/api/shorturl/new", async function (request, response) {
  const bool = await isUrlLive(request.body.url);

  if (bool === false) {
    return response.json({
      error: "invalid URL",
    });
  }

  return response.json({
    status: "success",
    original_url: request.body.url,
    short_url: "1",
  });
});

app.listen(port, function () {
  console.log(`Node.js listening on port ${port}`);
});