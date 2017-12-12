/**
 * instance関係のAPI
 */

var express = require('express');
var router = express.Router();

/**
 * 全てのインスタンスの内容を取得する
 */
router.get('/', function (req, res, next) {
    var param = getInstanceDetailByAll();
    res.header('Content-Type', 'application/json; charset=utf-8')
    res.send(param);
});

/**
 * 対象のインスタンス内容を取得する。
 */
router.get('/:id', function (req, res, next) {
    var param = getInstanceDetailById(req.params.id);
    res.header('Content-Type', 'application/json; charset=utf-8')
    res.send(param);
});

/**
 * インスタンスの死活監視（接続状況）を取得する。
 */
router.get('/health', function (req, res, next) {
    var param = getInstanceHealthByAll();
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
 * 登録されている全てのインスタンス情報を出力します。
 * @returns {JSON} ジョブ情報
 */
function getInstanceDetailByAll() {
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
 * 指定したIDのインスタンス情報を出力します。
 * @param {number} id - ジョブID
 * @returns {JSON} ジョブ情報
 */
function getInstanceDetailById(id) {
    var res = {
        "command": "whoami",
        "info": "エージェントの実行ユーザを表示します",
        "program": "cmd",
        "type": "job"
    };
    return res;
}

/**
 * インスタンスの接続状態を表示します。
 */
function getInstanceHealthByAll() {
    var res = {
        "command": "name",
        "info": "エージェントの実行ユーザを表示します",
        "program": "cmd",
        "type": "job"
    };
    return res;
}

