var express = require('express');
var router = express.Router();
var Client = require('node-rest-client').Client;
var client = new Client();

router.get("/mangas", function(req, res) {
    var db = req.db;

    db.get('mangas').find({},{ limit : 10, sort : { t : 1 } },function(err,docs){
        if (err) {
            handleError(res, err.message, "Failed to get mangas.");
        } else {
            res.status(200).json(docs);
        }
    });
});

router.get("/mangas/search/:p", function(req, res) {
    var db = req.db;

    db.get('mangas').find({"t": new RegExp(req.params.p, 'i')},{},function(err,docs){
         if (err) {
            handleError(res, err.message, "Failed to get mangas.");
        } else {
            res.status(200).json(docs);
        }
    });
});

router.get("/mangas/chapter/:id", function(req, res) {
    var address = "https://www.mangaeden.com/api/chapter/" + req.params.id + "/";
    client.get(address, function (data, response) {
        res.status(200).json(data);
    });
});

router.get("/mangas/:id", function(req, res) {
    var address = "https://www.mangaeden.com/api/manga/" + req.params.id + "/";
    client.get(address, function (data, response) {
        res.status(200).json(data);
    });
});

function handleError(res, reason, message, code) {
    console.log("ERROR: " + reason);
    res.status(code || 500).json({"error": message});
}

module.exports = router;