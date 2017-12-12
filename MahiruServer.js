var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

/**
 * APIフォルダ
 */
var apiDir = '/api/1/';
var job = require('.' + apiDir + 'job');
var jobnet = require('.' + apiDir + 'jobnet');
var history = require('.' + apiDir + 'history');
var instance = require('.' + apiDir + 'instance');

var app = express();

/**
 * viewエンジン設定
 */
app.set('views', path.join(__dirname, 'mahiru/views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

/**
 * API Router
 */
app.use(apiDir + 'job', job);
app.use(apiDir + 'jobnet', jobnet);
//app.use(apiDir + 'history', history);
//app.use(apiDir + 'instance', instance);

/**
 * catch 404 and forward to error handler
 */
app.use(function (req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
