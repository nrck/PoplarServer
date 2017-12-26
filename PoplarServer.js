/**
 * ジョブの制御関係
 */

// インスタンスからの接続を受けるサーバを立てる
const agentJSON = require('./agent.config.json')
const ioAgent = require("socket.io")()
const port = { kotori: "27133", mahiru: "27132" }

const __queuingJson = "./que.json";
const __runningJson = "./run.json";
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


function controlJobnet(id) {
    // 全実行中ジョブネットを読み込み
    let runs = JSON.parse(__fileUtil.read(__runningJson));
    let run = runs[id];
    //console.info(run)

    // コントロールスタート
    if (run.jobnet.jobs.end.state == "finish") {
        deleteRunningJsonById(id)

        run.header.state = "finish";
        console.info("[Finish jobnet] id => " + id)
    }
    if (run.header.state == "waiting") {
        run.header.state = "running";

        // スタートに設定されているジョブを全て実行する。
        for (let i = 1; i < run.jobnet.nextMatrix[0].length; i++) {
            if (0 < run.jobnet.nextMatrix[0][i]) {
                run.jobnet.nextMatrix[i][0] = 1;
                controlJob(id, run.jobnet.jobArray[i])
            }
        }
    }

    // ジョブネット遅延監視

    // ジョブネット打ち切り

    // ステータス書き換え後のジョブを書き出し
    runs[id] = run;
    if (__fileUtil.write(__runningJson, JSON.stringify(runs, null, "    "))) {
        console.info("[Updata running] id => " + id)
    } else {
        console.info("[Updata running error] id => " + id)
    }
}

function controlJob(id, jobcode) {
    // 全実行中ジョブネットを読み込み
    let runs = JSON.parse(__fileUtil.read(__runningJson));
    let job = runs[id].jobnet.jobs[jobcode];

    // コントロールスタート
    console.info("[Control Job] id => " + id + " jobcode => " + jobcode)
    switch (job.state) {
        case "waiting":
            // 前ジョブが終了済みか確認する。
            for (let i = 0; i < runs[id].jobnet.jobArray.length; i = i + 1) {
                let flag = true;
                //console.info(runs[id].jobnet.jobArray[i] + " == " + jobcode)
                if (runs[id].jobnet.jobArray[i] == jobcode) {
                    for (let j = 0; j < runs[id].jobnet.nextMatrix.length; j = j + 1) {
                        //console.info("(" + j + ", " + i + ") = " + runs[id].jobnet.nextMatrix[j][i] + " (" + i + ", " + j + ") = " + runs[id].jobnet.nextMatrix[i][j])
                        if (0 < runs[id].jobnet.nextMatrix[j][i] && 0 == runs[id].jobnet.nextMatrix[i][j]) {
                            flag = false;
                            break;
                        }
                    }

                    //console.info(flag)
                    if (flag) {
                        if (jobcode == "end") {
                            job.state = "finish";
                            setTimeout(controlJobnet, 1000, id);
                        } else {
                            job.state = "running";
                            console.info("[Start job] id => " + id + ", jobcode => " + jobcode)
                            let sendJson = {
                                id: id,
                                jobcode: jobcode,
                                program: job.program,
                                command: job.command
                            }
                            sendJob(job.agentName, sendJson);
                        }
                    } else {
                        setTimeout(controlJob, 1000, id, jobcode)
                    }
                }
            }
            break;
        case "running":
            break;
        case "error":
            // 次のエラー時ジョブを検索して実行開始する。
            for (let i = 0; i < runs[id].jobnet.jobArray.length; i = i + 1) {
                if (runs[id].jobnet.jobArray[i] == jobcode) {
                    for (let j = 0; j < runs[id].jobnet.errorMatrix[i].length; j = j + 1) {
                        if (0 < runs[id].jobnet.errorMatrix[i][j]) {
                            runs[id].jobnet.errorMatrix[j][i] = 1;
                            controlJob(id, run.jobnet.jobArray[j])
                        }
                    }
                }
            }
        case "finish":
            // 次のジョブを検索して実行開始する。
            console.info("[Finish job] id => " + id + ", jobcode => " + jobcode)
            for (let i = 0; i < runs[id].jobnet.jobArray.length; i = i + 1) {
                if (runs[id].jobnet.jobArray[i] == jobcode) {
                    for (let j = 0; j < runs[id].jobnet.nextMatrix[i].length; j = j + 1) {
                        if (0 < runs[id].jobnet.nextMatrix[i][j] && 0 == runs[id].jobnet.nextMatrix[j][i]) {
                            runs[id].jobnet.nextMatrix[j][i] = 1;
                            controlJob(id, runs[id].jobnet.jobArray[j])
                        }
                    }
                }
            }
            break;
    }
    // ステータス書き換え後のジョブを書き出し
    runs[id].jobnet.jobs[jobcode] = job;
    if (__fileUtil.write(__runningJson, JSON.stringify(runs, null, "    "))) {
        console.info("[Updata running] id => " + id + ", jobcode => " + jobcode)
    } else {
        console.info("[Updata running error] id => " + id + ", jobcode => " + jobcode)
    }
}

function finishJob(id, jobcode) {
    // 全実行中ジョブネットを読み込み
    let runs = JSON.parse(__fileUtil.read(__runningJson));
    runs[id].jobnet.jobs[jobcode].state = "finish";

    // ステータス書き換え後のジョブを書き出し
    if (__fileUtil.write(__runningJson, JSON.stringify(runs, null, "    "))) {
        console.info("[Updata running] id => " + id + ", jobcode => " + jobcode + " Finish")
    } else {
        console.info("[Updata running error] id => " + id + ", jobcode => " + jobcode + " Finish")
    }
    controlJob(id, jobcode);
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
        if (0 < waitTime && waitTime <= 60 * 60 * 1000) {
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
        console.info("Starting 誤差" + waitTime + "ms")
        if (deleteQuingJsonById(id)) {
            controlJobnet(appendRunningJson(que));
        } else {
            console.error("[Delete Queuing Error] Queuing ID => " + id + ", jobnet name => " + que.jobnet.jobnetName + "")
        }
    }
}

/**
 * キューイング登録
 * @param {Object} jobnet 
 * @param {Date} jobnetStartTime 
 */
function appendQueuingJson(jobnet, jobnetStartTime) {
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
    queues.forEach(que => {
        if (que.jobnet.agentName == jobnetName && que.header.startTime == jobnetStartTime.getTime()) {
            queue = que;
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
    let queues = JSON.parse(__fileUtil.read(__queuingJson));
    let flag = false;

    for (let i = 0; i < queues.length; i = i + 1) {
        que = queues[i];
        if (que.jobnet.jobnetName == jobnetName && que.header.startTime == jobnetStartTime.getTime()) {
            queues.splice(i, 1);
            flag = true;
            return
        }
    }

    return flag
}

/**
 * キューイング一覧からIDをもとに情報を削除
 * @param {*} id 
 */
function deleteQuingJsonById(id) {
    let queues = JSON.parse(__fileUtil.read(__queuingJson));
    let flag = false;

    for (let i = 0; i < queues.length; i = i + 1) {
        let que = queues[i];
        if (que.header.id == id) {
            queues.splice(i, 1);
            flag = true;
            break;
        }
    }
    return flag;
}

function appendRunningJson(que) {
    let run = que;
    //console.info(run)
    // 実行中ジョブネットファイルの存在確認
    if (!__fileUtil.isExist(__runningJson)) {
        // ファイルが無ければ作成
        if (__fileUtil.write(__runningJson, "{}")) {
            console.info("[File Create] " + __runningJson + " is created.")
        } else {
            return false
        }
    }

    // 全実行中ジョブネットを読み込み
    let json = JSON.parse(__fileUtil.read(__runningJson));
    if (json == null) {
        json = "{}";
    }

    // 実行中オブジェクトを作成
    let date = new Date();
    run.header.startTime = date.getTime();
    run.header.state = "waiting";

    // 全ジョブを待機中に変更
    for (let i = 1; i < run.jobnet.jobArray.length; i = i + 1) {
        let jobcode = run.jobnet.jobArray[i];
        run.jobnet.jobs[jobcode].state = "waiting";
    }

    // 多分ジョブの開始時刻とか全部ここで設定した方がいい

    // 全実行中ジョブネットに追加し書き込み
    json[run.header.id] = run;
    if (__fileUtil.write(__runningJson, JSON.stringify(json, null, "    "))) {
        return run.header.id
    } else {
        return null
    }
}

function deleteRunningJsonById(id) {
    let runs = JSON.parse(__fileUtil.read(__runningJson));
    let run = runs.id
    delete runs.id
    return true
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