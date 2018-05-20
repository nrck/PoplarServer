/**
 * 
 * @param {*} fileUtilObj FIle Utility object.
 * @param {*} quingJson Running jobnets json file.
 */
let qm = function (fileUtilObj, quingJson) {
    /**
     *  FIle Utility object.
     */
    this.__fileUtil = fileUtilObj;

    /**
     * Running jobnets json file.
     */
    this.__quingJson = quingJson;

    /**
     * Running jobnets.
     */
    this.runs = JSON.parse(this.__fileUtil.read(this.__quingJson));
};


/**
 * ジョブネットの開始待ち行列
 * @param {*} id 開始待ちするジョブネットID
 */
function queuingJobnet(id) {
    let que = selectQueuingJsonById(id);
    let date = new Date();
    let waitTime = que.header.startTime - date.getTime();

    if (date.getTime() < que.header.startTime) {
        setTimeout(queuingJobnet, 100 < waitTime ? waitTime / 2 : waitTime, id);
    } else {
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