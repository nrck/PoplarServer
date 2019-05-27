import { Jobnet } from "./Models/jobnet";

/**
 * Job Working!!
 */
export class Scheduler {
    /** True: This instance will scheduling to jobnets automatically by the interval. */
    public isEnableAutomaticallyScheduling: boolean;
    /** Set relative path that jobnet define file to this property. */
    public jobnetDefineFilePath: string;
    /** The number is managed by this instance. */
    private _jobnetSirialNo = 0;
    /** Jobnets are managed by this instance. */
    private _jobnets = undefined;

    constructor() {
        // 自動再スケジュールをONにする
        this.isEnableAutomaticallyScheduling = true;

        // Jobnet定義ファイルのパスを設定する
        this.jobnetDefineFilePath = './hoge.json';

        // 次のジョブネットのシリアル番号を設定する
        this.GetNextSirialNo();

        // 実行途中ジョブネットの再読み込み（途中でシステムが落ちた時用）
        this.ResumeRunningJobnets();

        // 初回スケジュール
        this.DoSchedule();
    }

    /**
     * You can get next serial jobnet number. If log files be existed, this method read the log files and set the property.
     * @returns Next serial jobnet number.
     */
    private GetNextSirialNo(): number {
        if (this._jobnetSirialNo === 0) {
            // ログ情報などから最後のシリアル番号を取得して設定。今は仮で0を設定
            this._jobnetSirialNo = 0;
        }
        this._jobnetSirialNo++;

        return this._jobnetSirialNo;
    }

    private ResumeRunningJobnets(): void {
        return;
    }


    private DoSchedule(): void {
        return;
    }
}
