// 各種モジュールの読み込み
var WebSocketServer = require('ws').Server

// Serverホストと待受ポート
var host = '0.0.0.0';
var port = '27131'  // ポニーテールちいさい

// websocketserver用オブジェクト
var wss = null;

// 定義済み伝聞内容
var who = { type: 'who' };      // エージェント側からの接続応答への返答
var deny = { type: 'deny' };    // アクセス拒否（未使用）


/**
 *  コネクションを開く
 */
exports.open = function (phost, pport) {
    // 引数省略時
    if (phost == null) {
        phost = host;
        pport = port;
    }

    // socketオープンしてない場合のみ実行
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

        console.log(STRING.connectionWaiting);
    } else {
        // すでにコネクションオープンしてた場合
        throw new Error(STRING.connectionStillOpened);
    }
};


/**
 * メッセージ受信イベント用関数
 * @param event イベントオブジェクト
 */
function onMessage(event) {
    // データの読取り
    var json = JSON.parse(event.data);

    // 電文タイプによって処理が変わる
    switch (json.type) {
        // ジョブ実行結果
        case "result":
            receiveStatus(json.jobnetName, json.jobnetStatus, json.resultCode);
            break;

        // who応答電文
        case "iam":
            connectionList[json.agentName] = event.target;
            console.log(STRING.newConnections + " > " + json.agentName);
            break;

        // 電文異常
        default:
            throw new Error(STRING.isErrorMessageType);
    }
}

/**
 * エージェント接続断イベント用関数
 * @param event イベントオブジェクト
 */
function onClose(event) {
    // コネクションリストからエージェント名を削除する
    for (var agentName in connectionList) {
        if (event.target === connectionList[agentName]) {
            delete connectionList[agentName];
            console.log(STRING.connectionClose + " > " + agentName);
            return;
        }
    }
}

