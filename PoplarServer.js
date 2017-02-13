/**
 * PoplarServer
 */

// 各種モジュールの読み込み
var WebSocketServer = require('ws').Server
var cron = require('cron').CronJob;

// ホストとポート
var host = "0.0.0.0";
var port = "27131"      //　ポニーテールちいさい

// websocketserver用オブジェクト
var wss = null;
var connectionList = {};
var jobnetList = {};
var jobCounter = 0;
var listLock = false;
var jobjson = {};

// 電文定義
var who = { type: "who" };

// ジョブネットの読み込み
readJobnet();

// cron登録
addCronJob();

// サーバー起動
conectionOpen(host, port);

// ジョブを有効にする
// ここのロジックは後々のwebUIのことも考えて書き直す
//for (var i = 0; i < jobnetList.length; i++) {
//    jobnetList[i].start();
//    console.log("ID " + i + " : ジョブを有効にしました。");
//}

// コネクションを開く
function conectionOpen(phost, pport) {
    if (wss == null) {
        wss = new WebSocketServer({
            host: phost,
            port: pport
        });
        wss.on('connection', function (ws) {
            ws.onmessage = onMessage;
            ws.onclose = onClose;
            sendJson(ws, who);
        });

        console.log("接続待機中");
    }
}

// メッセージ受信イベント時
function onMessage(event) {
    //console.log(util.inspect(event));
    var json = JSON.parse(event.data);
    switch (json.type) {
        case "result":
            receiveStatus(json.jobnetName, json.jobnetStatus, json.resultCode);
            break;
        case "iam":
            connectionList[json.agentName] = event.target;
            console.log("接続されました > " + json.agentName);
            break;
        default:
            break;
    }
}

function onClose(event) {
    for (var agentName in connectionList) {
        if (event.target === connectionList[agentName]) {
            delete connectionList[agentName];
            console.log("切断されました > " + agentName);
            break;
        }
    }
}


/**
 * ジョブネットの実行
 * @param jobnetName
 */
function startJobnet(jobnetName) {
    console.log("ジョブネットを開始しました > " + jobnetName + "(" + jobjson[jobnetName].info + ")");
    receiveStatus(jobnetName, "start", 200);
}

/**
 * ジョブの送信
 * @param jobnetName
 * @param jobnetStatus
 */
function sendJob(jobnetName, jobnetStatus) {
    var tmp = require('./job/' + jobjson[jobnetName]["jobnet"][jobnetStatus].job + '.json');
    var job = JSON.parse(JSON.stringify(tmp))
    console.log("ジョブを実行します > " + jobjson[jobnetName]["jobnet"][jobnetStatus].job + "(" + job.info + ")");
    if (jobjson[jobnetName]["jobnet"][jobnetStatus].agentName in connectionList) {
        try {
            var data = {};
            data.jobNo = getJobNomber();
            data.jobnetName = jobnetName;
            data.jobnetStatus = jobnetStatus;
            data.type = job.program;
            data.command = job.command;

            sendJson(connectionList[jobjson[jobnetName]["jobnet"][jobnetStatus]["agentName"]], data);
        } catch (e) {
            //console.log(util.inspect(e));
            receiveStatus(jobnetName, jobnetStatus, 500);
        } finally {

        }
    } else {
        receiveStatus(jobnetName, jobnetStatus, 404);
    }
}

/**
 * 実行結果の受取
 * @param jobnetName
 * @param jobnetStatus
 * @param jobresult
 */
function receiveStatus(jobnetName, jobnetStatus, jobresult) {
    switch (jobresult) {
        case 200:
            var next = jobjson[jobnetName]["jobnet"][jobnetStatus].next;
            break;
        case 404:
            var next = jobjson[jobnetName]["jobnet"][jobnetStatus].fail;
            console.log("エラーが発生しました > " + jobjson[jobnetName]['jobnet'][jobnetStatus]['agentName'] + "に接続できませんでした。" + jobnetName + "(" + jobjson[jobnetName]["jobnet"][jobnetStatus].job + ")");
            break;
        default:
            var next = jobjson[jobnetName]["jobnet"][jobnetStatus].fail;
            console.log("エラーが発生しました > " + jobnetName + "(" + jobjson[jobnetName]["jobnet"][jobnetStatus].job + ")");
    }

    if (next == "end") {
        console.log("ジョブネットが終了しました > " + jobnetName + "(" + jobjson[jobnetName].info + ")");
        console.log("");
    } else {
        sendJob(jobnetName, next);
    }
}

/**
 * ジョブネットの読み込み
 */
function readJobnet() {
    var tmp = require('./jobnet/jobnet.json');
    jobjson = JSON.parse(JSON.stringify(tmp))
}

/**
 * ジョブの登録
 */
function addCronJob() {
    Object.keys(jobjson).forEach(function (jobnetName) {
        if (jobjson[jobnetName].enable) {
            var tmpJob = new cron({
                cronTime: jobjson[jobnetName].cron,
                onTick: function () {
                    startJobnet(jobnetName)
                },
                start: true
            });
            jobnetList[jobnetName] = tmpJob;
        }
    });
}

/**
 * ジョブナンバーを採番する
 */
function getJobNomber() {
    while (listLock) { }
    listLock = true;
    jobNum = jobCounter;;
    jobCounter++;
    listLock = false;
    return jobNum;
}

function sendJson(ws, sendData) {
    ws.send(JSON.stringify(sendData));
    return JSON.stringify(sendData);
}