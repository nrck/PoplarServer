/**
 * ジョブの制御関係
 */

// インスタンスからの接続を受けるサーバを立てる
//var agentJSON = JSON.parse(JSON.stringify(require('./config.json')));
var agentJSON = require('./agent.config.json');
var port = {
    "kotori": "27133",
    "mahiru": "27132"
};
var instanceHash = {};
var ioAgent = require("socket.io")();


// ソケット通信制御部
ioAgent.sockets.on("connection", function (socket) {
    // IPアドレス表示
    console.log("client IP address => " + socket.id);

    // メッセージ受信時
    socket.on("message", hogehoge);

    // インスタンスから接続があったとき、登録済みインスタンスか検証する
    socket.on("whoami", function (data) {
        var flag = false;
        agentJSON.forEach(element => {
            if (element.agentName == data.agentName) {
                if (instanceHash[data.agentName] != null) {
                    if (instanceHash[data.agentName] != socket.id) {
                        ioAgent.sockets[instanceHash[data.agentName]].disconnect();
                    } else {
                        return true;
                    }
                }
                instanceHash[data.agentName] = socket.id;
                flag = true;
                return true;
            }
        });
        if (!flag) {
            var json = {
                "result": "false",
                "data": data
            }
            console.log(data.agentName + " is not permited or still connected.");
        } else {
            var json = {
                "result": "success",
                "data": data
            }
            console.log(data.agentName + " is permited.");
            console.log("Total instance : " + Object.keys(instanceHash).length)
            console.log("Total sockets  : " + ioAgent.sockets.length)
            console.log("")
        }
        console.log(socket.id);
        socket.json.emit("result", json);
    });

    socket.on("disconnect", function (reason) {
        var disconnectName = Object.keys(instanceHash).reduce(function (r, k) { return instanceHash[k] == socket.id ? k : r }, null);
        delete instanceHash[disconnectName];
        console.log(disconnectName + " is disconnect.");
        console.log(reason);
    });

    // ジョブ
    socket.on("job", function (data) {
        console.log("job!! :" + data);
    });




});

ioAgent.listen(port.kotori, { host: '0.0.0.0' });
console.log("start...");


var hogehoge = function (data) {
    console.log(data.name);
}



// ジョブネットを読み込む部分

// ジョブネットをタスク登録する

// ジョブネットの実行結果をDBに保存する


/**
 * まひるちゃんとの接続部分
 */

// ジョブネットを登録する

// ジョブを登録する

// インスタンスを登録する

// ジョブの実行結果を表示する

// 