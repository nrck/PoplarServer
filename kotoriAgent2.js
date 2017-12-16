/**
 * Agent側のなんやかんや
 */

// 設定
var config = {
    "server": {
        "ip": "127.0.0.1",
        "port": "27133",
    },
    "agent": {
        "name": "testAgent"
    }
}

var io = require('socket.io-client');
var socket = null;
var interval = 1;
openConnection();

function openConnection() {
    if (socket == null) {
        console.log("接続処理中");
        socket = io('ws://' + config.server.ip + ':' + config.server.port);
        socket.on('connect', function () {
            socket.json.emit("whoami", JSON.parse('{"agentName":"' + config.agent.name + '"}'));
            socket.on("result", result);
            socket.on('disconnect', reConnect);
        });
        
    } else {
        console.log("socket is opened.")
    }
}

var result = function (data) {
    console.log("result : " + data.result);
    console.log(data.data);
}

var reConnect = function (reason) {
    console.log("切断されました。（" + reason + "）");
    socket = null;

    // 待ち時間＝再接続時間^2 * 100ms（最大60秒）
    var waitTime = ((interval * interval * 100) >= 60000 * 5) ? 60000 * 5 : interval * interval * 100;
    console.log("再接続" + interval + "回目（" + Math.ceil(waitTime / 1000) + "秒後に再接続をします）");
    setTimeout(function () {
        openConnection();
    }, waitTime);
    interval++;
}