var express = require('express');
var router = express.Router();
var bcrypt = require('bcrypt');

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

router.post("/login/", function (req, res) {
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

                  res.status(200).json({result: 1});
              }
          });
      }
  });
});

router.post("/register/", function (req, res) {
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
                  req.session.userName = usr.name;

                  res.status(200).json({result: 1});
              });
          });
      }
  });
});

module.exports = router;
