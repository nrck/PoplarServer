/**
 * 
 * @param {*} fileUtilObj FIle Utility object.
 * @param {*} runningJson Running jobnets json file.
 */
let jm = function (fileUtilObj, runningJson) {
    /**
     *  FIle Utility object.
     */
    this.__fileUtil = fileUtilObj;

    /**
     * Running jobnets json file.
     */
    this.__runningJson = runningJson;

    /**
     * Running jobnets.
     */
    this.runs = JSON.parse(this.__fileUtil.read(this.__runningJson));
};

/**
 * Update running jobnets
 */
jm.prototype.updateRuns = function () {
    if (__fileUtil.write(__runningJson, JSON.stringify(runs, null, "    "))) {
        console.info("[Updata running]")
    } else {
        console.error("[Updata running error]")
    }
    this.runs = JSON.parse(__fileUtil.read(__runningJson));
};

/**
 * Control jobnet execution.
 * @param {*} id Jobnet serial id
 */
jm.prototype.controlJobnet = function (id) {
    // 既に終了していないか確認
    if (this.runs[id].jobnet.jobs.end.state == "finish") {
        this.runs[id].header.state = "finish";
        this.updateRuns();
    };

    // 待ち状態なら開始する
    if (this.runs[id].header.state == "waiting") {
        this.runs[id].header.state = "running";
        this.updateRuns();

        // スタートに設定されているジョブを全て実行する。
        for (let i = 1; i < run.jobnet.nextMatrix[0].length; i++) {
            if (0 < this.runs[id].jobnet.nextMatrix[0][i]) {
                this.runs[id].jobnet.nextMatrix[i][0] = 1;
                this.updateRuns();
                // ジョブの実行
                //controlJob(id, this.runs[id].jobnet.jobArray[i])
            }
        };

        // 終了遅延時刻に再度キューイングする

        // 打ち切り時刻に再度キューイングする
    };

    // 打ち切り時刻

    // ジョブネット遅延監視

};

/**
 * Append running jobnet json file.
 * @param {*} que Que jobnet 
 */
jm.prototype.appendRunningJson = function (que) {
    let run = que;
    let date = new Date();

    // set running jobnet header
    run.header.startTime = date.getTime();
    run.header.state = "waiting";

    // update job state
    for (let i = 1; i < run.jobnet.jobArray.length; i = i + 1) {
        let jobcode = run.jobnet.jobArray[i];
        // 本日が開始日か確認する
        if (true) {
            run.jobnet.jobs[jobcode].state = "waiting";
        } else {
            run.jobnet.jobs[jobcode].state = "pass";
        }
    }

    this.runs[run.header.id] = run;
    this.updateRuns();
};

/**
 * 
 * @param {*} id 
 */
jm.prototype.deleteRunningJsonById = function(id) {
    let run = this.runs[id];
    delete this.runs[id];
    return true
}

/**
 * 
 * @param {*} id 
 */
jm.prototype.getRunningJsonByState = function(state) {
    let arr = new Array();
    for (let i = 0; i < this.runs.length; i = i + 1) {
        if (this.runs[i].header.state == state) {
            arr.push(this.runs[i])
        }
    }
    return arr
}

/**
 * Control job execution.
 * @param {String} id Jobnet serial id
 * @param {String} jobcode Job's unique code
 */
jm.prototype.controlJob = function (id, jobcode) {
    switch (runs[id].jobnet.jobs[jobcode].state) {
        case "waiting":
            // Confirm whether the previous job has been completed.
            for (let i = 0; i < runs[id].jobnet.jobArray.length; i = i + 1) {
                let completed = true;
                if (runs[id].jobnet.jobArray[i] == jobcode) {

                    // check next matrix.
                    for (let j = 0; j < runs[id].jobnet.nextMatrix.length; j = j + 1) {
                        // nextMatrix[j][i] :: Direction (0 => No, 1 => yes)
                        // nextMatrix[i][j] :: The previous job state (0 => Not yet, 1 => Completed)
                        if (runs[id].jobnet.nextMatrix[j][i] == 1 && runs[id].jobnet.nextMatrix[i][j] == 0) {
                            completed = false;
                            break;
                        }
                    }

                    if (completed) {
                        // end job finished.
                        if (jobcode == "end") {
                            runs[id].jobnet.jobs[jobcode].state = "finish";
                            this.updateRuns();
                        } else {
                            runs[id].jobnet.jobs[jobcode].state = "running";
                            this.updateRuns();
                            let sendJson = {
                                id: id,
                                jobcode: jobcode,
                                program: runs[id].jobnet.jobs[jobcode].program,
                                command: runs[id].jobnet.jobs[jobcode].command
                            }
                            return [runs[id].jobnet.jobs[jobcode].agentName, sendJson];
                        }
                    } else {
                        setTimeout(this.controlJob, 1000, id, jobcode)
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
                            this.controlJob(id, run.jobnet.jobArray[j])
                        }
                    }
                }
            }
        case "pass":
        case "finish":
            // 次のジョブを検索して実行開始する。
            for (let i = 0; i < runs[id].jobnet.jobArray.length; i = i + 1) {
                if (runs[id].jobnet.jobArray[i] == jobcode) {
                    for (let j = 0; j < runs[id].jobnet.nextMatrix[i].length; j = j + 1) {
                        if (0 < runs[id].jobnet.nextMatrix[i][j] && 0 == runs[id].jobnet.nextMatrix[j][i]) {
                            runs[id].jobnet.nextMatrix[j][i] = 1;
                            this.controlJob(id, runs[id].jobnet.jobArray[j])
                        }
                    }
                }
            }
            break;
    }
    this.updateRuns();
};

/**
 * Finish job function.
 * @param {*} id 
 * @param {*} jobcode 
 * @param {*} rc 
 */
jm.prototype.finishJob = function (id, jobcode, rc) {
    if (rc == 0) {
        runs[id].jobnet.jobs[jobcode].state = "finish";
    } else {
        runs[id].jobnet.jobs[jobcode].state = "error";
    }
    this.updateRuns();
    this.controlJob(id, jobcode);
};

