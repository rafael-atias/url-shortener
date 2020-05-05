'use strict';

// imports

const express = require('express');

const cors = require('cors');

const app = express();

const bodyParser = require("body-parser");

const { runSanitizer, newShortUrlHandler, getUrlHandler } = require("./helpers");

// Basic Configuration 
const port = process.env.PORT || 3000;

// middleware
app.use(cors());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here
app.use(bodyParser.urlencoded({ extended: false }));

// routes definitions
app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function (req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

app.post("/api/shorturl/new", runSanitizer, newShortUrlHandler);

app.get("/api/shorturl/:url", getUrlHandler);

app.listen(port, function () {
  console.log(`Node.js listening on port ${port}`);
});