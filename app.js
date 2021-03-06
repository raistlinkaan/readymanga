var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mongodb = require("mongodb");
var monk = require('monk');
var session = require('express-session');
MongoStore = require('connect-mongo')(session);
var db = monk('localhost:27017/manga');

var routes = require('./routes/index');
var api = require('./routes/api');
var user = require('./routes/user');

var app = express();

app.use(require('prerender-node').set('prerenderToken', 'OwZYGl99Y7dVOokDiBMk'));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: 'rdymng@3001_a_space_oddesy',
  resave: true,
  saveUninitialized: false,
  cookie: {maxAge: 60000 * 60 * 24 * 30}, // 30 days
  store: new MongoStore({url: 'mongodb://localhost:27017/manga'})
}));

//mongodb settings
app.use(function(req,res,next){
  req.db = db;
  next();
});

app.use('/', routes);
app.use('/api', api);
app.use('/user', user);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

module.exports = app;
