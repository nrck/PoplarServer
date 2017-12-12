/**
 * instance関係のAPI
 */

var express = require('express');
var router = express.Router();

/**
 * 全てのジョブネットの最新の実行結果を取得する。
 */
router.get('/', function (req, res, next) {
    var param = getHistoryByAll();
    res.header('Content-Type', 'application/json; charset=utf-8')
    res.send(param);
});

/**
 * 全てのジョブネットのyyyy年mm月dd日の実行結果を取得する。
 */
router.get('/date/:yyyymmdd', function (req, res, next) {
    var param = getHistoryByDate(req.params.yyyymmdd, "*");
    res.header('Content-Type', 'application/json; charset=utf-8')
    res.send(param);
});

/**
 * 対象のジョブネットのyyyy年mm月dd日の実行結果を取得する。
 */
router.get('/date/:yyyymmdd/:id', function (req, res, next) {
    var param = getHistoryByDate(req.params.yyyymmdd, req.params.id);
    res.header('Content-Type', 'application/json; charset=utf-8')
    res.send(param);
});

/**
 * 対象のジョブネットの最新の実行結果を取得する。
 */
router.get('/:id/', function (req, res, next) {
    var param = getHistoryById(req.params.id, 1);
    res.header('Content-Type', 'application/json; charset=utf-8')
    res.send(param);
});

/**
 * 対象のジョブネットの最新の{count}件の実行結果を取得する。
 */
router.get('/:id/:count', function (req, res, next) {
    var param = getHistoryById(req.params.id, req.params.count);
    res.header('Content-Type', 'application/json; charset=utf-8')
    res.send(param);
});

/**
 * 対象のジョブネットの指定曜日の実行結果を取得する。(今回は実装しない)
 */
router.get('/:id/:weekday', function (req, res, next) {
    var param = getHistoryByWeekday(req.params.id, req.params.count);
    res.header('Content-Type', 'application/json; charset=utf-8')
    res.send(param);
});

module.exports = router;