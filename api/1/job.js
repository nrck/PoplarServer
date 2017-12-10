/**
 * job関係のAPI
 */

var express = require('express');
var router = express.Router();

/**
 * 全てのジョブの内容を取得する
 */
router.get('/', function (req, res, next) {
  var param = getJobDetailByAll();
  res.header('Content-Type', 'application/json; charset=utf-8')
  res.send(param);
});

/**
 * 対象のジョブ内容を取得する。
 */
router.get('/:id', function (req, res, next) {
  var param = getJobDetailById(req.params.id);
  res.header('Content-Type', 'application/json; charset=utf-8')
  res.send(param);
});

/**
 * 対象のジョブ内容を取得する。
 */
router.get('/name/:name', function (req, res, next) {
  var param = getJobDetailByName(req.params.name);
  res.header('Content-Type', 'application/json; charset=utf-8')
  res.send(param);
});

router.post('/', function (req, res, next) {
  var success = { "result": "success" };
  var failure = { "result": "failure" };
  var postjson = {
    "jobName": req.body.jobName,
    "timeStart": req.body.timeStart,
    "timeFinish": req.body.timeFinish,
    "timeDeadline": req.body.timeDeadline,
    "schedule": req.body.schedule,
    "types": req.body.types,
    "program": req.body.program
  }
  var param = { "header": success, "receive": postjson };
  res.header('Content-Type', 'application/json; charset=utf-8')
  res.send(param);
});


module.exports = router;

/**
 * 登録されている全てのジョブ情報を出力します。
 * @returns {JSON} ジョブ情報
 */
function getJobDetailByAll() {
  var res = [
    {
      "command": "whoami",
      "info": "エージェントの実行ユーザを表示します",
      "program": "cmd",
      "type": "job"
    },
    {
      "command": "echo %date%\nrem aaaaa\necho %time%",
      "info": "エージェントの時刻を表示します",
      "program": "cmd",
      "type": "job"
    }
  ];
  return res;
}

/**
 * 指定したIDのジョブ情報を出力します。
 * @param {number} id - ジョブID
 * @returns {JSON} ジョブ情報
 */
function getJobDetailById(id) {
  var res = {
    "command": "whoami",
    "info": "エージェントの実行ユーザを表示します",
    "program": "cmd",
    "type": "job"
  };
  return res;
}

function getJobDetailByName(name) {
  var res = {
    "command": "name",
    "info": "エージェントの実行ユーザを表示します",
    "program": "cmd",
    "type": "job"
  };
  return res;
}

