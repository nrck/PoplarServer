/**
 * ジョブの制御関係
 */

// インスタンスからの接続を受けるサーバを立てる
const agentJSON = require('./agent.config.json')
const ioAgent = require("socket.io")()
const port = { kotori: "27133", mahiru: "27132" }
const async = require('async');

const __queuingJson = "./que.json";
const __doingJson = "./do.json";
const __historyJson = "./history.json";
const __fileUtil = require('./common.js').fileUtil();

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
        socket.json.emit("result", json)
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
    // エージェントは生きているか？
    // jsondbに登録
    // すでに実行済みではないか検証
    // 
    instance[agentName].socket.json.emit("job", job);
}

function controlJobnet(id) {

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
            // 同時刻の実行が登録されていないか確認（jobnetネームと開始時刻が重複してないか確認）
            if (!isQueuingJsonByName(jobnet.agentName, jobnetStartTime)) {
                // 登録無しなら登録を実行
                let id = putQueuingJson(jobnet, jobnetStartTime);
                if (id != null) {
                    console.info("[Put Queuing] JobnetName => " + jobnet.jobnetName + ", Start at " + jobnetStartTime.getTime() + " (" + id + ")")
                    setTimeout(queuingJobnet, waitTime, id);
                } else {
                    console.error("[Put Queuing Error] JobnetName => " + jobnet.jobnetName + ", Start at " + jobnetStartTime.getTime() + " (" + id + ")")
                }
            }
        }
    });

    // 自分自身を30秒後に実行
    setTimeout(setQueJobnetAll, 30 * 1000);
}

/**
 * ジョブネットの開始待ち行列
 * @param {*} id 開始待ちするジョブネットID
 */
function queuingJobnet(id) {
    let que = selectQueuingJsonById(id);
    let date = new Date();
    let waitTime = que.header.startTime - date.getTime();

    if (date.getTime() < que.header.startTime) {
        console.info("Waiting... " + waitTime + "ms")
        setTimeout(queuingJobnet, 100 < waitTime ? waitTime / 2 : waitTime, id);
    } else {
        // do.json
        console.info("にゃーん 誤差" + waitTime + "ms")

        controlJobnet(id);
    }
}

/**
 * キューイング登録
 * @param {Object} jobnet 
 * @param {Date} jobnetStartTime 
 */
function putQueuingJson(jobnet, jobnetStartTime) {
    let id = jobnetId.getId();
    let que = new Object();

    // キューイングファイルの存在確認
    if (!__fileUtil.isExist(__queuingJson)) {
        // ファイルが無ければ作成
        if (__fileUtil.write(__queuingJson, "[]")) {
            console.info("[File Create] " + __queuingJson + " is created.")
        } else {
            return null
        }
    }

    // 全キューイングを読み込み
    let json = JSON.parse(__fileUtil.read(__queuingJson));
    if (json == null) {
        json = "{}";
    }

    // キューオブジェクトを作成
    que["header"] = { id: id, startTime: jobnetStartTime.getTime() };
    que["jobnet"] = jobnet;

    // 全キューイングに追加し書き込み
    json.push(que);
    if (__fileUtil.write(__queuingJson, JSON.stringify(json, null, "    "))) {
        return id
    } else {
        return null
    }
}


/**
 * キューイング一覧に情報を追加
 * @param {*} jobnet 
 * @param {*} jobnetStartTime 
 * @param {*} id 
 */
function updatQueuingJson(jobnet, jobnetStartTime, id) {
}

/**
 * ジョブネットがキューイング一覧にあるかどうか
 * @param {String} jobnetName 
 * @param {Date} jobnetStartTime 
 * @returns 実行待ちの有無
 */
function isQueuingJsonByName(jobnetName, jobnetStartTime) {
    let tmp = selectQueuingJsonByName(jobnetName, jobnetStartTime)
    if (tmp == null || tmp.header.id == null) {
        return false
    } else {
        return true
    }
}

/**
 * キューイング情報を名前と開始時間から検索
 * @param {String} jobnetName 
 * @param {Date} jobnetStartTime 
 */
function selectQueuingJsonByName(jobnetName, jobnetStartTime) {
    let queues = JSON.parse(__fileUtil.read(__queuingJson));
    let queue = null;
    if (queues == null) {
        return null
    }
    queues.forEach(obj => {
        if (obj.jobnet.agentName == jobnetName && obj.header.startTime == jobnetStartTime.getTime()) {
            queue = obj;
            return
        }
    });
    return queue
}

/**
 * キューイング情報をIDから検索する
 * @param {*} id 
 */
function selectQueuingJsonById(id) {
    let queues = JSON.parse(__fileUtil.read(__queuingJson));
    let queue = null;
    if (queues == null) {
        return null
    }
    queues.forEach(obj => {
        if (obj.header.id == id) {
            queue = obj;
            return
        }
    });
    return queue
}

/**
 * キューイング情報を名前と開始時刻をもとに削除する
 * @param {*} jobnetName 
 * @param {*} jobnetStartTime 
 */
function deleteQuingJsonByName(jobnetName, jobnetStartTime) {

}

/**
 * キューイング一覧からIDをもとに情報を削除
 * @param {*} id 
 */
function deleteQuingJsonById(id) {
    let que = null;
    async.series([
        function (callback) {
            let queues = JSON.parse(__fileUtil.read(__queuingJson));
            for (let i = 0; i < queues.length; i++) {
                que = queues[i];
                if (que.header.id == id) {
                    queues.splice(i, 1);
                    return
                }
            }
            callback(null, null);
        },
        function (callback) {
            let doing = JSON.parse(__fileUtil.read(__doingJson));
            if (doing == null) {
                doing = {};
            }
            doing[id] = que.jobnet;
            if (__fileUtil.write(__queuingJson, JSON.stringify(doing, null, "    "))) {
                return callback(null, null);
            } else {
                return callback("error", null);
            }
        },
        function (callback) {
            fs.readFile("file-C", "utf-8", function (err, data) {
                console.log("file-C");
                callback(null, "third")
            });
        }
    ], function (err, results) {
        if (err) {
            throw err;
        }
        console.log('series all done. ' + results);
    });
}



/**
 * まひるちゃんとの接続部分
 */

// ジョブネットを登録する

// ジョブを登録する

// インスタンスを登録する

// ジョブの実行結果を表示する

// 