var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Tetration Application Dependency Diagram' });
});
router.get('/cdp',function(req, res, next) {
  res.render('cdp', { title: 'CDP Test ' });
});
router.get('/alert', function(req, res, next) {
  res.render('alert', { title: 'Alert Viewer' });
});

module.exports = router;
