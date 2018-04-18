var express = require('express');
var router = express.Router();
var Client = require('node-rest-client').Client;
var async = require('async');
var bcrypt = require('bcrypt');

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

router.get("/manga/chapter/:mangaId/:chapterId", function (req, res) {
    var address = "https://www.mangaeden.com/api/chapter/" + req.params.chapterId + "/";
    client.get(address, function (data, response) {
        if(req.session.userId)
        {
            var db = req.db;
            db.get('users').find({_id: req.session.userId}, { limit: 1 }, function (err, user) {
                if (err) throw err;
                var isnew = true;
                
                if(user.length != 0)
                {
                    /*
                        Since one can read few thousands of chapters i think it should be okay. 
                        If any performance problems occur, then i'll come up with another solution.
                    */
                    
                    for(i = 0; i< user[0].mangas.length; i++)
                    {
                        if(user[0].mangas[i].mangaid == req.params.mangaId)
                        {
                            if(user[0].mangas[i].chapters.indexOf(req.params.chapterId) == -1)
                                user[0].mangas[i].chapters.push(req.params.chapterId)

                            break;
                        }
                    }

                    db.get('users').update({_id: req.session.userId}, {$set : {"mangas": user[0].mangas}}, function(err,doc){
                        res.status(200).json(data);
                    });
                }
                else
                    res.status(200).json(data);
            });
        }
        else
            res.status(200).json(data);
    });
});

router.get("/manga/detail/:id", function (req, res) {
    var address = "https://www.mangaeden.com/api/manga/" + req.params.id + "/";
    client.get(address, function (data, response) {
        var db = req.db;
        data["isFavorite"] = 0;
        data["readedChapters"] = [];

        db.get('users').find({_id: req.session.userId}, { limit: 1 }, function (err, user) {
            if (err) throw err;
            var usermangas = [];

            if(user.length != 0)
            {
                /*
                    Since one can read few thousands of chapters i think it should be okay. 
                    If any performance problems occur, then i'll come up with another solution.
                */

                for(i = 0; i< user[0].mangas.length; i++)
                {
                    if(user[0].mangas[i].mangaid == req.params.id)
                    {
                        if(user[0].mangas[i].isFavorite == true)
                            data.isFavorite = 1;
                        data.readedChapters = user[0].mangas[i].chapters;

                        break;
                    }
                }

                if(!data.readedChapters)
                    data.readedChapters = [];
            }

            res.status(200).json(data);
        });
    });
});

router.post("/manga/addRemoveFavorites/", function (req, res) {
    if(req.session.userId)
    {
        var db = req.db;
        db.get('users').find({_id: req.session.userId}, { limit: 1 }, function (err, user) {
            if (err) throw err;
            var isnew = true;
            
            if(user.length != 0)
            {
                /*
                    Since one can read few thousands of chapters i think it should be okay. 
                    If any performance problems occur, then i'll come up with another solution.
                */

                for(i = 0; i< user[0].mangas.length; i++)
                {
                    if(user[0].mangas[i].mangaid == req.body.id)
                    {
                        isnew = false;
                        user[0].mangas[i].isFavorite = !user[0].mangas[i].isFavorite;

                        break;
                    }
                }

                if(isnew == true)
                {
                    user[0].mangas.push({mangaid: req.body.id, isFavorite: true, chapters: []});
                }

                db.get('users').update({_id: req.session.userId}, {$set : {"mangas": user[0].mangas}}, function(err,doc){
                    res.status(200).json({result: 1, status: user[0].mangas[i].isFavorite});
                });
            }
        });
    }
    else
        res.status(200).json({result: 0, error: 'Please login first'});
});

router.get("/manga/favorites/", function (req, res) {
    if(req.session.userId)
    {
        var db = req.db;
        db.get('users').find({_id: req.session.userId}, { limit: 1 }, function (err, user) {
            if (err) throw err;
            var usermangas = [];

            for(i = 0; i< user[0].mangas.length; i++)
            {
                if(user[0].mangas[i].isFavorite === true)
                    usermangas.push(user[0].mangas[i].mangaid)
            }
            
            db.get('mangas').find({"i": {$in: usermangas}}, { sort: { h: -1 } }, function (err2, mangas) {
                if (err2) throw err2;
                res.status(200).json({result: 1, list: mangas});
            });
        });
    }
    else
        res.status(200).json({result: 0});
});

router.post("/usr/login/", function (req, res) {
    var db = req.db;

    db.get('users').find({"email": req.body.email}, { limit: 1 }, function (err, user) {
        if (err) throw err;
        
        if(user.length == 0)
            res.status(200).json({result: 0, error: 'Loggin error'});
        else
        {
            bcrypt.compare(req.body.password, user[0].password, function(err2, reslt) {
                if (err || !user) {
                    res.status(200).json({result: 0, error: 'Wrong email or password'});
                } else {
                    req.session.userId = user[0]._id;
                    req.session.userName = user[0].name;
                    var oneWeek = 7 * 24 * 3600 * 1000; //1 weeks
                    req.session.cookie.expires = new Date(Date.now() + oneWeek);
                    req.session.cookie.maxAge = oneWeek; 

                    res.status(200).json({result: 1});
                }
            });
        }
    });
});

router.post("/usr/register/", function (req, res) {
    var db = req.db;

    db.get('users').find({"email": req.body.email}, { limit: 1 }, function (err, user) {
        if (err) throw err;
        
        if(user.length != 0)
            res.status(200).json({result: 0, error: 'email is already taken'});
        else
        {
            bcrypt.hash(req.body.password, 10, function(err, hash) {
                if (err) res.status(200).json({result: 0, error: 'unexpected error'});

                var usr = { name: req.body.name, email: req.body.email, password: hash, mangas: [] };
                db.get('users').insert(usr, function(err) {
                    if (err) res.status(200).json({result: 0, error: 'unexpected error'});
                    
                    req.session.userId = usr._id;

                    var oneWeek = 7 * 24 * 3600 * 1000; //1 weeks
                    req.session.cookie.expires = new Date(Date.now() + oneWeek);
                    req.session.cookie.maxAge = oneWeek;

                    res.status(200).json({result: 1});
                });
            });
        }
    });
});

module.exports = router;