/**
 * ジョブの制御関係
 */

// インスタンスからの接続を受けるサーバを立てる
const agentJSON = require('./agent.config.json')
const ioAgent = require("socket.io")()
const port = { kotori: "27133", mahiru: "27132" }
let instance = {}
let jobnets = require('./jobnet.json')

// ソケット通信制御部
ioAgent.sockets.on("connection", function (socket) {
    // メッセージ受信時
    //socket.on("message", hogehoge);

    // インスタンスから接続があったとき、登録済みインスタンスか検証する
    socket.on("whoami", function (data) {
        let tmp = {};
        if (isPermitAgent(socket, data.agentName)) {
            tmp = { result: "success", data: data }
        } else {
            tmp = { result: "false", data: data }
        }
        console.info("================================================================")
        console.info("[" + tmp.result + "] " + data.agentName)
        console.info("[Total instance] " + Object.keys(instance).length)
        console.info("================================================================")
        socket.json.emit("result", json)
    });

    // インスタンスとの接続が切れた時
    socket.on("disconnect", function (reason) {
        let disconnectName = Object.keys(instance).reduce(function (r, k) { return instance[k] == socket.id ? k : r }, null);
        delete instance[disconnectName];
        console.info("================================================================")
        console.info("[Disconnect] " + disconnectName + "(" + reason + ")")
        console.info("[Total instance] " + Object.keys(instance).length)
        console.info("================================================================")
    });
});

ioAgent.listen(port.kotori);
readJobnet();
setQueJobnetAll();

/**
 * ジョブの発行を行う
 * @param {JSON} job 発行するジョブ
 * @param {string} agentName 発行対象のエージェント 
 */
function sendJob(agentName, job) {
    // エージェントは生きているか？
    // jsondbに登録
    // すでに実行済みではないか検証
    // 
    instance[agentName].socket.json.emit("job", job);
}

/**
 * 許可されたエージェントか検証を行う。
 * @param {Object} socket socketオブジェクト
 * @param {string} agentName エージェント名
 * @return {boolean} 真偽値を返す
 */
function isPermitAgent(socket, agentName) {
    agentJSON.forEach(obj => {
        if (obj.agentName == agentName) {
            instance[agentName] = { id: socket.id, socket: socket };
            return true;
        }
    });
    return false;
}

/**
 * ジョブネット情報の再読込
 */
function readJobnet() {
    jobnets = null;
    jobnets = require('./jobnet.json')
}

/**
 * ジョブネットの開始時刻監視
 */
function setQueJobnetAll() {
    let waitTime = -1;
    let jobnetStartTime = -1;

    jobnets.forEach(jobnet => {
        // ジョブネットの開始時刻を作る
        // *だったらsetJobnetAllの実行日の値を適用
        // TODO 開始時刻が複数の場合の対応を記載
        let date = new Date();
        jobnetStartTime = new Date(
            jobnet.startTime.year == "*" ? date.getFullYear() : jobnet.startTime.year,
            jobnet.startTime.month == "*" ? date.getMonth() : jobnet.startTime.month - 1,
            jobnet.startTime.day == "*" ? date.getDate() : jobnet.startTime.day,
            jobnet.startTime.hours == "*" ? date.getHours() : jobnet.startTime.hours,
            jobnet.startTime.minute == "*" ? (date.getMinutes() + 1) : jobnet.startTime.minute
        );

        // 実行時刻までの時間を計算
        waitTime = date.getTime() < jobnetStartTime.getTime() - 5000 ?
            jobnetStartTime.getTime() - 5000 - date.getTime() : -1;

        // 実行まで1時間を切っていれば5秒前からタイミングを取るようにセット
        if (0 < waitTime && waitTime <= 60 * 60 * 1000) {
            console.info("[Queuing jobnet] " + jobnet.jobnetName)
            setTimeout(queuingJobnet, waitTime, jobnet, jobnetStartTime);
        }
    });

    // 自分自身を30分後に実行
    setTimeout(setQueJobnetAll, 1 * 60 * 1000);
}

/**
 * ジョブネットの開始待ち行列
 * @param {*} jobnet 開始待ちするジョブネット
 */
function queuingJobnet(jobnet, jobnetStartTime) {
    // DBに今日分の実行が登録されていないか確認（jobnetネームと開始時刻が重複してないか確認）
    // 登録されていたらこのタイミングは破棄
    // 登録無しなら登録を実行
    // IDの採番
    // ジョブネットステータス＝待機中
    // ジョブネット内のジョブを全てを前ジョブ終了待ちにする。
    // 開始時刻以降ならジョブネットを実行
    // 開始時刻以前なら500ms後に再実行

    let date = new Date();
    if (date.getTime() < jobnetStartTime.getTime()) {
        console.info("Waiting...")
        setTimeout(queuingJobnet, 500, jobnet, jobnetStartTime);
    } else {
        console.info("にゃーん")
    }
}

/**
 * 採番し36進数を返します。
 * @param {number} init 
 */
let makeId = function (init) {
    let local = init;
    return {
        getId: function () {
            local++;
            return local.toString(36);
        }
    }
};

// ジョブネットの実行結果をDBに保存する


/**
 * まひるちゃんとの接続部分
 */

// ジョブネットを登録する

// ジョブを登録する

// インスタンスを登録する

// ジョブの実行結果を表示する

// 