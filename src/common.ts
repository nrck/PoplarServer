export class Common {
    // ログ設定
    /** ログを出力するか？ */
    public static DEBUG_OUTPUT = true;
    /** ログ出力レベル */
    public static DEBUG_MODE = 0;
    /** デバックレベル */
    public static STATE_DEBUG = 0;
    /** インフォレベル */
    public static STATE_INFO = 1;
    /** ワーニングレベル */
    public static STATE_WARN = 2;
    /** エラーレベル */
    public static STATE_ERROR = 3;

    // ジョブステータス
    /** 実行中 */
    public static STATE_RUNNING = 'Running';
    /** 開始時刻待ち */
    public static STATE_WAITING_START_TIME = 'Waiting (start time)';
    /** 前ジョブ終了待ち */
    public static STATE_WAITING_BEFORE_JOB = 'Waiting (before job)';
    /** 実行なし */
    public static STATE_PASS = 'Pass';
    /** 実行正常終了 */
    public static STATE_FINISH = 'Finish';
    /** 実行異常終了 */
    public static STATE_FINISH_ERROR = 'Error';
    /** 実行遅延終了 */
    public static STATE_FINISH_DELAY = 'Finish (Delay)';
    /** 実行打切終了 */
    public static STATE_FINISH_DEADLINE = 'Finish (Deadline)';

    // RunDATE（月
    /** ジョブネットに従う */
    // public static RUN_MONTH_JOBNET = 'Follow the jobnet';
    /** 毎月 */
    public static RUN_MONTH_EVERY = 'Every month';
    /** 指定月 */
    public static RUN_MONTH_DESIGNATED = 'Designated month';

    // RunDATE（日
    /** ジョブネットに従う */
    // public static RUN_DAY_JOBNET = 'Follow the jobnet';
    /** 毎日 */
    public static RUN_DAY_EVERY = 'Every day';
    /** 営業日 */
    public static RUN_DAY_WORKDAY = 'Workday';
    /** 休日 */
    public static RUN_DAY_HOLIDAY = 'Holiday';
    /** 指定曜日 */
    public static RUN_DAY_DESIGNATED_WEEKDAY = 'Designated weekday';
    /** 指定日 */
    public static RUN_DAY_DESIGNATED = 'Designated day';

    // Event
    public static EVENT_HELLO = 'Hello';
    public static EVENT_SEND_JOB = 'SendJob';
    public static EVENT_RESULT_JOB = 'ResultJob';
    public static EVENT_DISCONNECT = 'disconnect';
    public static EVENT_KILL_JOB = 'KillJob';
    public static EVENT_SCHEDULE_RELOAD = 'ScheduleReload';

    public static EVENT_EXEC_ERROR = 'ExecError';
    public static EVENT_EXEC_SUCCESS = 'ExecSuccess';
    public static EVENT_EXEC_KILLED = 'ExecKilled';

    public static ENV_SERVER_HOST = 'PoplarServer';

    /**
     *
     * @param state Log level. Debug: 0, Info: 1, Warn: 2, Error: 3.
     * @param str Log string.
     */
    public static trace(state: number, str: string): void {
        if (this.DEBUG_OUTPUT && this.DEBUG_MODE <= state) {
            const date = new Date().toLocaleString();
            const logstr = `[${date}]${str}`;

            switch (state) {
                // debug
                case this.STATE_DEBUG:
                    if (typeof console.debug === 'undefined') {
                        console.log(logstr);
                    } else {
                        console.debug(logstr);
                    }
                    break;

                // info
                case this.STATE_INFO:
                    console.info(logstr);
                    break;

                // warning
                case this.STATE_WARN:
                    console.warn(logstr);
                    break;

                // error
                case this.STATE_ERROR:
                    console.error(logstr);
                    break;

                default:
                    this.trace(this.STATE_ERROR, `The state is undefined. state:${state}, str:${str}`);
                    break;
            }
        }
    }
}
