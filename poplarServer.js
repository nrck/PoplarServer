/**
 * ジョブの制御関係
 */

// インスタンスからの接続を受けるサーバを立てる
const agentJSON = require('./agent.config.json')
const ioAgent = require("socket.io")()
const port = require('./config.json').port

const __queuingJson = "./que.json";
const __runningJson = "./run.json";
const __historyJson = "./history.json";
const __fileUtil = require('./common').fileUtil();
const __jobcon = require("./control-job")

let instance = {}
let jobnets = require('./jobnet.json')
let jobnetId = require('./common.js').makeId(0);

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
        console.info("[" + tmp.result + "] " + data.agentName)
        console.info("[Total instance] " + Object.keys(instance).length)
        socket.json.emit("result", tmp)
    });

    socket.on("jobresult", function (data) {
        let tmp = {};
        if (true) {
            tmp = { result: "success", data: data }
        } else {
            tmp = { result: "false", data: data }
        }
        console.info("[Job exec result] id => " + data.id + " jobcode => " + data.jobcode + " stdio =>" + data.stdio)
        socket.json.emit("result", tmp)
        finishJob(data.id, data.jobcode);
    });

    // インスタンスとの接続が切れた時
    socket.on("disconnect", function (reason) {
        let disconnectName = Object.keys(instance).reduce(function (r, k) { return instance[k] == socket.id ? k : r }, null);
        delete instance[disconnectName];
        console.info("[Disconnect] " + disconnectName + "(" + reason + ")")
        console.info("[Total instance] " + Object.keys(instance).length)
    });
});

ioAgent.listen(port.kotori);
console.info("[Server start] Port => " + port.kotori)

readJobnet();
setQueJobnetAll();

/**
 * ジョブの発行を行う
 * @param {JSON} job 発行するジョブ
 * @param {string} agentName 発行対象のエージェント 
 */
function sendJob(agentName, job) {
    instance[agentName].socket.json.emit("job", job);
}

/**
 * 許可されたエージェントか検証を行う。
 * @param {Object} socket socketオブジェクト
 * @param {string} agentName エージェント名
 * @return {boolean} 真偽値を返す
 */
function isPermitAgent(socket, agentName) {
    let flag = false;
    agentJSON.forEach(obj => {
        if (obj.agentName == agentName) {
            instance[agentName] = { id: socket.id, socket: socket };
            flag = true;
            return
        }
    });
    return flag
}

/**
 * ジョブネット情報の再読込
 */
function readJobnet() {
    jobnets = null;
    jobnets = require('./jobnet.json')
    setTimeout(readJobnet, 1000);
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
        if (0 < waitTime && waitTime <= 60 * 60 * 1000 && jobnet.enable) {
            // 同時刻の実行が登録されていないか確認（jobnetネームと開始時刻が重複してないか確認）
            if (!isQueuingJsonByName(jobnet.agentName, jobnetStartTime)) {
                // 登録無しなら登録を実行
                let id = appendQueuingJson(jobnet, jobnetStartTime);
                if (id != null) {
                    console.info("[Append Queuing] JobnetName => " + jobnet.jobnetName + ", Start at " + jobnetStartTime.getTime() + " (" + id + ")")
                    setTimeout(queuingJobnet, waitTime, id);
                } else {
                    console.error("[Append Queuing Error] JobnetName => " + jobnet.jobnetName + ", Start at " + jobnetStartTime.getTime() + " (" + id + ")")
                }
            }
        }
    });

    // 自分自身を30秒後に実行
    setTimeout(setQueJobnetAll, 30 * 1000);
}



function appendHistoryJson(run) {
    let history = run;

    // 全履歴ファイルの存在確認
    if (!__fileUtil.isExist(__historyJson)) {
        // ファイルが無ければ作成
        if (__fileUtil.write(__historyJson, "[]")) {
            console.info("[File Create] " + __historyJson + " is created.")
        } else {
            return false
        }
    }

    // 全履歴を読み込み
    let json = JSON.parse(__fileUtil.read(__historyJson));
    if (json == null) {
        json = "[]";
    }

    // 履歴オブジェクトを作成
    let date = new Date();
    history.header.finishTime = date.getTime();

    // 全履歴に追加し書き込み
    json.push(history);

    // 終了時刻降順
    json.sort(function (a, b) {
        if (a.header.finishTime > b.header.finishTime) return -1;
        if (a.header.finishTime < b.header.finishTime) return 1;
        return 0;
    });

    if (__fileUtil.write(__historyJson, JSON.stringify(json, null, "    "))) {
        return true
    } else {
        return false
    }
}


/**
 * まひるちゃんとの接続部分
 */

// ジョブネットを登録する

// ジョブを登録する

// インスタンスを登録する

// ジョブの実行結果を表示する

// 
