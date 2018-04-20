var express = require('express');
var router = express.Router();
var backgroundJobs = require('../bin/backgroundjobs');
var Client = require('node-rest-client').Client;
var client = new Client();

var limit = require("simple-rate-limiter");
var request = limit(require("request")).to(10).per(1000);

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Ready Manga', loggedin: (req.session.userId ? 1 : 0), username: req.session.userName });
});

/* GET sync manga from mangaeden. */
router.get('/sync', function(req, res, next) {
  try {
    var db = req.db;
    var mangas = db.get('mangas');

    client.get("https://www.mangaeden.com/api/list/0/", function (data, response) {
      for (var i = 0; i < data.total; i++) {
        request("https://www.mangaeden.com/api/manga/" + data.manga[i].i, function(err, res, body) {
          data.manga[this.x].detail = body;
          mangas.update({"i": data.manga[this.x].i}, data.manga[this.x], { "new": true, "upsert": true });
        }.bind( {x: i} ));
      }
    });

    client.on('error', function (err) {
      console.log('request error', err);
    });

    res.render('index', { title: 'Express' });
  }
  catch (e) {
    console.log(e);
  }
});

/* GET logout and redirect index. */
router.get('/logout', function (req, res, next) {
  if (req.session) {
    // delete session object
    req.session.destroy(function (err) {
      if (err) {
        return next(err);
      } else {
        return res.redirect('/');
      }
    });
  }
});

module.exports = router;
