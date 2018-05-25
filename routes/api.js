var express = require('express');
var router = express.Router();
var Client = require('node-rest-client').Client;
var async = require('async');
var bcrypt = require('bcrypt');

var pagingViewModel = require('../viewmodels/mangaPagingViewModel');
var client = new Client();

var detailAddress = "https://www.mangaeden.com/api/manga/";
var chapterAddress = "https://www.mangaeden.com/api/chapter/";

router.post('/manga/list/', function (req, res) {
    var db = req.db;
    var paging = new pagingViewModel();
    paging.fill(req.body);
    var mangas = db.get('mangas');
    whereSearch = {};

    if (paging.keyword != '') {
        var filter = new RegExp(paging.keyword, 'i');
        whereSearch["t"] =  filter;
    }

    if (paging.category != '')
        whereSearch["c"] = { $in: ['' + paging.category + ''] };

    async.parallel([
        function (callback) {
            mangas.find(whereSearch, { skip: paging.skip, limit: 12, sort: { h: -1 } }, function (err, docs) {
                if (err) throw err;
                paging.list = docs;
                callback();
            });
        },
        function (callback) {
            mangas.count(whereSearch, function (err, doc_count) {
                if (err) throw err;
                paging.total = doc_count;
                callback();
            });
        }
    ], function (err, results) {
        if (err) throw err;
        res.status(200).json(paging);
    });
});

router.get("/manga/chapter/:mangaId/:chapterId", function (req, res) {
    var address = chapterAddress + req.params.chapterId + "/";
    client.get(address, function (data, response) {
        if (req.session.userId) {
            var db = req.db;
            db.get('users').find({ _id: req.session.userId }, { limit: 1 }, function (err, user) {
                if (err) throw err;
                var isnew = true;

                if (user.length != 0) {
                    /*
                        Since one can read few thousands of chapters i think it should be okay. 
                        If any performance problems occur, then i'll come up with another solution.
                    */

                    for (i = 0; i < user[0].mangas.length; i++) {
                        if (user[0].mangas[i].mangaid == req.params.mangaId) {
                            if (user[0].mangas[i].chapters.indexOf(req.params.chapterId) == -1)
                                user[0].mangas[i].chapters.push(req.params.chapterId)

                            break;
                        }
                    }

                    db.get('users').update({ _id: req.session.userId }, { $set: { "mangas": user[0].mangas } }, function (err, doc) {
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
    var address = detailAddress + req.params.id + "/";
    client.get(address, function (data, response) {
        var db = req.db;
        data["isFavorite"] = 0;
        data["readedChapters"] = [];

        db.get('users').find({ _id: req.session.userId }, { limit: 1 }, function (err, user) {
            if (err) throw err;
            var usermangas = [];

            if (user.length != 0) {
                /*
                    Since one can read few thousands of chapters i think it should be okay. 
                    If any performance problems occur, then i'll come up with another solution.
                */

                for (i = 0; i < user[0].mangas.length; i++) {
                    if (user[0].mangas[i].mangaid == req.params.id) {
                        if (user[0].mangas[i].isFavorite == true)
                            data.isFavorite = 1;
                        data.readedChapters = user[0].mangas[i].chapters;

                        break;
                    }
                }

                if (!data.readedChapters)
                    data.readedChapters = [];
            }

            res.status(200).json(data);
        });
    });
});

router.post("/manga/addRemoveFavorites/", function (req, res) {
    if (req.session.userId) {
        var db = req.db;
        db.get('users').find({ _id: req.session.userId }, { limit: 1 }, function (err, user) {
            if (err) throw err;
            var isnew = true;

            if (user.length != 0) {
                /*
                    Since one can read few thousands of chapters i think it should be okay. 
                    If any performance problems occur, then i'll come up with another solution.
                */

                for (i = 0; i < user[0].mangas.length; i++) {
                    if (user[0].mangas[i].mangaid == req.body.id) {
                        isnew = false;
                        user[0].mangas[i].isFavorite = !user[0].mangas[i].isFavorite;
                        user[0].mangas[i].isArchive = false;

                        break;
                    }
                }

                if (isnew == true) {
                    user[0].mangas.push({ mangaid: req.body.id, isFavorite: true, isArchive: false, chapters: [] });
                }

                db.get('users').update({ _id: req.session.userId }, { $set: { "mangas": user[0].mangas } }, function (err, doc) {
                    res.status(200).json({ result: 1, status: user[0].mangas[i].isFavorite });
                });
            }
        });
    }
    else
        res.status(200).json({ result: 0, error: 'Please login first' });
});

router.get("/manga/favorites/", function (req, res) {
    if (req.session.userId) {
        var db = req.db;
        db.get('users').find({ _id: req.session.userId }, { limit: 1 }, function (err, user) {
            if (err) throw err;
            var usermangas = [];
            var unreadChapters = {};

            /*for (i = 0; i < user[0].mangas.length; i++) {
                if (user[0].mangas[i].isFavorite === true && user[0].mangas[i].isArchive === false)
                    usermangas.push(user[0].mangas[i].mangaid)
            }

            db.get('mangas').find({ "i": { $in: usermangas } }, { sort: { h: -1 } }, function (err2, mangas) {
                if (err2) throw err2;
                res.status(200).json({ result: 1, list: mangas });
            });*/

            async.parallel([
                function (callback) {
                    var favorites = user[0].mangas = user[0].mangas.filter(function (x) {
                        return x.isFavorite === true && x.isArchive === false;
                    });

                    for (i = 0; i < favorites.length; i++) {
                        if (user[0].mangas[i].isFavorite === true && user[0].mangas[i].isArchive === false) {
                            usermangas.push(user[0].mangas[i].mangaid);
        
                            (function (index) {
                                client.get(detailAddress + user[0].mangas[index].mangaid + "/", function (data, response) {
                                    unreadChapters[user[0].mangas[index].mangaid] = data.chapters.filter(function (x) {
                                        return user[0].mangas[index].chapters.indexOf(x[3]) < 0;
                                    }).length;

                                    if(index == favorites.length -1)
                                        callback();
                                });
                            }(i));
                        }
                    }
                }
            ], function (err, results) {
                if (err) throw err;

                db.get('mangas').find({ "i": { $in: usermangas } }, { sort: { t: 1 } }, function (err2, mangas) {
                    if (err2) throw err2;
                    res.status(200).json({ result: 1, list: mangas, unreadChapters: unreadChapters });
                });
            });

        });
    }
    else
        res.status(200).json({ result: 0 });
});

router.get("/manga/archive/", function (req, res) {
    if (req.session.userId) {
        var db = req.db;
        db.get('users').find({ _id: req.session.userId }, { limit: 1 }, function (err, user) {
            if (err) throw err;
            var usermangas = [];

            for (i = 0; i < user[0].mangas.length; i++) {
                if (user[0].mangas[i].isArchive === true)
                    usermangas.push(user[0].mangas[i].mangaid)
            }

            db.get('mangas').find({ "i": { $in: usermangas } }, { sort: { t: 1 } }, function (err2, mangas) {
                if (err2) throw err2;
                res.status(200).json({ result: 1, list: mangas });
            });
        });
    }
    else
        res.status(200).json({ result: 0 });
});

router.post("/manga/addRemoveArchive/", function (req, res) {
    if (req.session.userId) {
        var db = req.db;
        db.get('users').find({ _id: req.session.userId }, { limit: 1 }, function (err, user) {
            if (err) throw err;
            var isnew = true;

            if (user.length != 0) {
                for (i = 0; i < user[0].mangas.length; i++) {
                    if (user[0].mangas[i].mangaid == req.body.id) {
                        isnew = false;

                        //user[0].mangas[i].isFavorite = !user[0].mangas[i].isFavorite;
                        user[0].mangas[i].isArchive = !user[0].mangas[i].isArchive;
                        break;
                    }
                }

                if (isnew == true) {
                    res.status(200).json({ result: 0, error: 'Please add manga to favorites first' });
                }

                db.get('users').update({ _id: req.session.userId }, { $set: { "mangas": user[0].mangas } }, function (err, doc) {
                    res.status(200).json({ result: 1, status: user[0].mangas[i].isArchive });
                });
            }
        });
    }
    else
        res.status(200).json({ result: 0, error: 'Please login first' });
});

router.post("/manga/markAsAllRead/", function (req, res) {
    if (req.session.userId) {
        var db = req.db;
        db.get('users').find({ _id: req.session.userId }, { limit: 1 }, function (err, user) {
            if (err) throw err;
            var manga = req.body;

            if (user.length != 0) {
                for (i = 0; i < user[0].mangas.length; i++) {
                    if (user[0].mangas[i].mangaid == manga.id) {
                        if (user[0].mangas[i].isFavorite == true) {
                            user[0].mangas[i].chapters = manga.chapters;
                        }

                        break;
                    }
                }

                db.get('users').update({ _id: req.session.userId }, { $set: { "mangas": user[0].mangas } }, function (err, doc) {
                    res.status(200).json({ result: 1, status: user[0].mangas[i].chapters });
                });
            }
        });
    }
    else
        res.status(200).json({ result: 0, error: 'Please login first' });
});

module.exports = router;