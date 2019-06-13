/**
 * Job Working!!
 */
export class Scheduler {
    /** True: This instance will scheduling to jobnets automatically by the interval. */
    public isEnableAutomaticallyScheduling: boolean;

    constructor() {
        // 自動再スケジュールをONにする
        this.isEnableAutomaticallyScheduling = true;

        // 実行途中ジョブネットの再読み込み（途中でシステムが落ちた時用）
        this.ResumeRunningJobnets();

        // 初回スケジュール
        this.DoSchedule();
    }

    private ResumeRunningJobnets(): void {
        return;
    }


    private DoSchedule(): void {
        return;
    }
}
