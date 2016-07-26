var express = require('express');
var router = express.Router();
var backgroundJobs = require('../bin/backgroundjobs');
var Client = require('node-rest-client').Client;
var client = new Client();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/sync', function(req, res, next) {
  try {
    var db = req.db;
    var mangas = db.get('mangas');

    client.get("https://www.mangaeden.com/api/list/0/ ", function (data, response) {
      for (var i = 0; i < data.total; i++) {
        client.get("https://www.mangaeden.com/api/manga/" + data.manga[i].i, function (detailData, detailResponse) {
          data.manga[i].detail = detailData;
          mangas.update({"i": data.manga[i].i}, data.manga[i], { "new": true, "upsert": true });
        });
      }
    });

    res.render('index', { title: 'Express' });
  }
  catch (e) {
    console.log(e);
  }
});

module.exports = router;
