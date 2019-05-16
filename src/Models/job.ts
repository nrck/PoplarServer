import { Common } from '../common';
import * as IF from './interface';

export class Job implements IF.Job {
    isSpecial = false;
    cwd?: string;
    code: string;
    agentName: string;
    info: string;
    schedule: IF.RunDate;
    file?: string;
    args?: string[];
    state: string;
    returnCode: string | undefined;
    exceptionMes: string | undefined;
    startTime: Date | undefined; // ログ用
    finishTime: Date | undefined; // ログ用

    /**
     * ジョブを作成します。
     * @param code ジョブ固有のコードです。
     * @param agentName 実行対象のエージェント名です。
     * @param info ジョブの説明文です。
     * @param schedule ジョブ実行スケジュールです。
     * @param options オプションです。trueだと特殊ジョブになります。string型だとファイル名のみの設定です。
     */
    constructor(code: string, agentName: string, info: string, schedule: IF.RunDate, options: true | string | jobOption) {
        this.code = code;
        this.agentName = agentName;
        this.info = info;
        this.schedule = schedule;
        if (typeof options === 'string') {
            this.file = options;
        } else if (typeof options === 'boolean') {
            this.isSpecial = true;
        } else {
            this.file = options.file;
            this.cwd = options.cwd;
            this.args = options.args;
        }
        this.state = Common.STATE_WAITING_START_TIME;
        Common.trace(Common.STATE_DEBUG, `Job object was created. code:${code}, agentName:${agentName}`);
    }
}

export interface jobOption {
    file?: string;
    args?: string[];
    cwd?: string
}