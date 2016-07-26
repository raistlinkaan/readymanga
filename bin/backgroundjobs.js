/*var client = require('node-rest-client').Client;
var mongoConnectionString = "mongodb://127.0.0.1/manga";
var agenda = new Agenda({db: {address: mongoConnectionString}});
var monk = require('monk');
var db = monk('localhost:27017/manga');

module.exports = {
    syncDb: function() {
        syncDb();
    },
    init: function () {
        init();
    }
};

function syncDb() {
    try {
        var mangas = db.get('mangas');

        client.get("https://www.mangaeden.com/api/list/0/ ", function (data, response) {
            for (var i = 0; i < data.length; i++) {
                client.get("http://remote.site/rest/xml/method", function (detailData, detailResponse) {
                    data[i].detail = detailData;
                    mangas.update({"i": data.i}, data, { "new": true, "upsert": true });
                });
            }
        });
    }
    catch (e) {
        console.log(e);
    }
}

function initialize() {
    agenda.define('syncdb', {priority: 'high', concurrency: 10}, function (job, done) {
        syncDb();
    });

    agenda.on('ready', function () {
        var weeklySync = agenda.create('syncdb');
        weeklySync.repeatEvery('1 week').save();
        agenda.start();
    });
}*/



