/**
 * Agent側のなんやかんや
 */

// 設定
const config = {
    "server": {
        "ip": "192.168.2.2",
        "port": "27133",
    },
    "agent": {
        "name": "testAgent"
    }
}

const io = require('socket.io-client');
const child_process = require('child_process');
let interval = 1;
let socket = null;

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
        socket.on('job', receiveJob);
    });
    socket.connect();
}
open();

const receiveJob = function (data) {
    //sendJson = {
    //    id: id,
    //    jobcode: jobcode,
    //    program: job.program,
    //    command: job.command
    //}
    console.info(data)
    let json = JSON.parse(JSON.stringify(data));
    let stdio = null;
    switch (json.program) {
        case "shell":
            break;
        case "powershell":
            stdio = child_process.execSync(json.command);
            break;
    };
    json.stdio = stdio.toString();
    socket.json.emit("jobresult", json);
}

const result = function (data) {
    console.log("result : " + data.result);
    console.log(data.data);
}

const reConnect = function (reason) {
    console.log("切断されました。（" + reason + "）");
    socket.disconnect(true);
    //socket = null;
    // 待ち時間＝再接続時間^2 * 100ms（最大60秒）
    let waitTime = ((interval * interval * 100) >= 60000 * 5) ? 60000 * 5 : interval * interval * 100;
    console.log("再接続" + interval + "回目（" + waitTime + "ミリ秒後に再接続をします）");
    setTimeout(function () {
        open();
    }, waitTime);
    interval++;
}