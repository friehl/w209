var express = require('express');
var router = express.Router();
var pg = require('pg')
var config = require('config.json')('./db.json');
var connectionString = process.env.DATABASE_URL || config.DATABASE_URL;

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Football Injuries', name: 'Fletcher' });
});

router.get('/about', function(req, res, next) {
  res.render('about')
});

router.get('/graph', function(req, res, next) {
  var title = req.param('title', 'Football Salaries')
  res.render('graph', {title: title})
});

router.get('/api', function(req, res) {
  var results = [];
  var years = req.query.years;
  pg.connect(connectionString, function(err, client, done) {
    var query = client.query("select team, status, played from football.raw_data_2 where year IN ("+ years.join(',') +");");
    query.on('row', function(row) {
      results.push(row);
    });
    query.on('end', function() {
      client.end();
      return res.json(results)
    });
    if(err) {
      console.log(err);
    }
  });
});

module.exports = router;
