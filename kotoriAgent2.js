/**
 * Agent側のなんやかんや
 */

// 設定
var config = {
    "server": {
        "ip": "192.168.2.2",
        "port": "27133",
    },
    "agent": {
        "name": "testAgent"
    }
}

var io = require('socket.io-client');
var interval = 1;
var socket = null;

function open() {
    socket = io('ws://' + config.server.ip + ':' + config.server.port, {
        autoConnect: false
    });
    console.log("接続処理中");
    socket.on('connect', function () {

        console.log("emit");
        socket.json.emit("whoami", JSON.parse('{"agentName":"' + config.agent.name + '"}'));
        socket.on("result", result);
        socket.on('disconnect', reConnect);
    });

    socket.connect();
}
open();

setTimeout(function () {
    // 接続を切る
    socket.disconnect();

    // 再接続
    //socket.connect();  // -> connected
}, 3000);


var result = function (data) {
    console.log("result : " + data.result);
    console.log(data.data);
}

var reConnect = function (reason) {
    console.log("切断されました。（" + reason + "）");
    socket.disconnect(true);
    //socket = null;
    // 待ち時間＝再接続時間^2 * 100ms（最大60秒）
    var waitTime = ((interval * interval * 100) >= 60000 * 5) ? 60000 * 5 : interval * interval * 100;
    console.log("再接続" + interval + "回目（" + waitTime + "ミリ秒後に再接続をします）");
    setTimeout(function () {
        open();
    }, waitTime);
    interval++;
}