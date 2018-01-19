var express = require('express');
var router = express.Router();
var Client = require('node-rest-client').Client;
var async = require('async');

var pagingViewModel = require('../viewmodels/mangaPagingViewModel');
var client = new Client();

router.post('/manga/list/', function (req, res) {
    var db = req.db;
    var paging = new pagingViewModel(); 
    paging.fill(req.body);
    var mangas = db.get('mangas');
    whereSearch = {};

    if(paging.keyword != '' ){
        var filter = new RegExp(paging.keyword, 'i');
        whereSearch["t"] = filter;
    }

    if(paging.category != '')
        whereSearch["c"] = {$in: ['' + paging.category + '']};

    async.parallel([
        function(callback) {
            mangas.find(whereSearch, { skip: paging.skip, limit: 12, sort: { h: -1 } }, function (err, docs) {
                if (err) throw err;
                paging.list = docs;
                callback();
            });
        },
        function(callback) {
            mangas.count(whereSearch, function(err, doc_count){
                if (err) throw err;
                paging.total = doc_count;
                callback();
            });
        }
    ], function(err, results) {
        if (err) throw err;
        res.status(200).json(paging);
    });
});

router.get("/manga/chapter/:id", function (req, res) {
    var address = "https://www.mangaeden.com/api/chapter/" + req.params.id + "/";
    client.get(address, function (data, response) {
        res.status(200).json(data);
    });
});

router.get("/manga/:id", function (req, res) {
    var address = "https://www.mangaeden.com/api/manga/" + req.params.id + "/";
    client.get(address, function (data, response) {
        res.status(200).json(data);
    });
});

function handleError(res, reason, message, code) {
    console.log("ERROR: " + reason);
    res.status(code || 500).json({ "error": message });
}

module.exports = router;