
// 設定ファイルの読み込み
config = JSON.parse(JSON.stringify(require('./config.json')));

// websocketの読み込み
var WebSocket = require('ws');

// websocketの作成
var ws = null;

// shell実行モジュールの読み込み
var exec = require('child_process').exec

// 名乗る
var iam = { type: "iam", agentName: config.agentName };

// 現在実行中のジョブ
var nowJob = {};

var interval = 1;

// サーバへ接続の実行
conectionOpen();

function conectionOpen() {
    if (ws == null) {
        console.log("接続処理中");
        ws = new WebSocket('ws://' + config.server.host + ':' + config.server.port);
        ws.onopen = onOpen;
        ws.onmessage = onMessage;
        ws.onclose = onClose;
        ws.onerror = onError;
    }
}

// 接続完了イベント時
function onOpen(event) {
    console.log("接続しました");
    interval = 1;
}

// メッセージ受信イベント時
function onMessage(message, flags) {
    //console.log('received:', message);
    var json = JSON.parse(message.data);
    switch (json.type) {
        case "cmd":
            nowJob = json;
            execCmd(nowJob.command);
            break;
        case "who":
            var res = sendJson({ type: "iam", agentName: config.agentName });
            //console.log("send : " + data);
            break;
    };
}

// 接続が閉じられた時
function onClose(event) {
    console.log("切断されました。（" + event.code + "）");
    ws = null;

    // 待ち時間＝再接続時間^2 * 100ms（最大60秒）
    var waitTime = ((interval * interval * 100) >= 60000) ? 60000 : interval * interval * 100;
    console.log("再接続" + interval + "回目（" + Math.ceil(waitTime / 1000) + "秒後に再接続をします）");
    setTimeout(function () {
        conectionOpen();
    }, waitTime);
    interval++;
}

// エラー発生時
function onError(event) {
    //console.log(event);
}

// コマンド実行
function execCmd(command) {
    var commandArray = command.split(/\r\n|\r|\n/);

    var obj = {};
    obj.jobnetName = nowJob.jobnetName;
    obj.jobnetStatus = nowJob.jobnetStatus;
    obj.type = "result";
    obj.resultCode = 404;
    obj.resultStr = "";

    for (var i = 0; i < commandArray.length; i++) {
        exec(commandArray[i], function (err, stdout, stderr) {
            obj.resultStr += stdout;
            console.log(stdout);
            if (err) {
                console.log(err);
                obj.resultCode = err.code;
                obj.resultStr = err.signal;
                sendJson(obj);
                return;
            }
        });
    }
    obj.resultCode = 200;
    sendJson(obj);
}

// JSON送信
function sendJson(sendData) {
    ws.send(JSON.stringify(sendData));
    return JSON.stringify(sendData);
}