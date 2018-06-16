import { EventEmitter } from 'events';
import * as fs from 'fs';
import { Common } from './common';
import { JobJSON, JobnetFile, SerialJobJSON } from './interface';
import { Job } from './job';
import { Jobnet } from './jobnet';
import { PoplarException } from './poplarException';

export class Jobscheduler {
    public static SCANNING_TIME = 86400000; // 1 Day.
    public static SCAN_RANGE = 7; // 1 Week.
    public static PADDING_TIME = 5000; // 5 sec
    public static SERIAL_RADIX = 36;

    private _jobnets = new Array<Jobnet>();
    private _autoSchedule: boolean;
    private _jobnetFilePath: string;
    private _serial: number;
    private _events: EventEmitter = new EventEmitter();

    /**
     * ジョブスケジューラ
     * @param filepath ジョブネット定義ファイル
     * @param startSerial 開始シリアル番号
     */
    constructor(filepath: string, startSerial?: number) {
        Common.trace(Common.STATE_DEBUG, 'Jobschedulerが生成されました。');
        this._autoSchedule = true;
        this._jobnetFilePath = filepath;
        this._serial = startSerial || 0;
        this.initScheduleJobnets();
        this._events.on(Common.EVENT_RECEIVE_SCHEDULE_RELOAD, () => {
            this.deleteWaitingJobnet();
            this.initScheduleJobnets();
        });
        setTimeout(() => { this.rerunScheduleJobnets(); }, Jobscheduler.SCANNING_TIME);
    }

    public get jobnets(): Jobnet[] {
        return this._jobnets;
    }

    public set jobnets(value: Jobnet[]) {
        this._jobnets = value;
    }

    public get autoSchedule(): boolean {
        return this._autoSchedule;
    }

    public set autoSchedule(value: boolean) {
        this._autoSchedule = value;
        if (value) {
            this.rerunScheduleJobnets();
        }
    }

    public get jobnetFilePath(): string {
        return this._jobnetFilePath;
    }

    public set jobnetFilePath(value: string) {
        this._jobnetFilePath = value;
    }

    public get serial(): number {
        return this._serial;
    }

    public set serial(value: number) {
        this._serial = value;
    }

    public get events(): EventEmitter {
        return this._events;
    }

    public set events(value: EventEmitter) {
        this._events = value;
    }
    public getSrial(): string {
        this.serial++;

        return this.serial.toString(Jobscheduler.SERIAL_RADIX);
    }

    /**
     * 初回のスケジューリングを行います
     */
    public initScheduleJobnets(): void {
        Common.trace(Common.STATE_DEBUG, 'initScheduleJobnetsが実行されました。');
        const jobnetFile = JSON.parse(fs.readFileSync(this.jobnetFilePath, 'utf8')) as JobnetFile;
        for (let i = 0; i < Jobscheduler.SCAN_RANGE; i++) {
            const today = new Date();
            today.setDate(today.getDate() + i);
            this.scheduleJobnets(today, jobnetFile);
        }
    }

    /**
     * ジョブネットのスケジューリングを定期的に実行します。
     */
    public rerunScheduleJobnets(): void {
        Common.trace(Common.STATE_DEBUG, 'rerunScheduleJobnetsが実行されました。');
        if (this.autoSchedule) {
            const today = new Date();
            // 当日～SCAN_RANGEは再スケジューリングしない仕様
            today.setDate(today.getDate() + Jobscheduler.SCAN_RANGE);
            this.scheduleJobnets(today, JSON.parse(fs.readFileSync(this.jobnetFilePath, 'utf8')) as JobnetFile);
            setTimeout(() => { this.rerunScheduleJobnets(); }, Jobscheduler.SCANNING_TIME);
        }
    }

    /**
     * 指定日のスケジューリングを実行します。
     * @param targetDate スケジュールを実行する指定日
     * @param jobnetFile スケジュール対象のジョブネットファイル
     */
    public scheduleJobnets(targetDate: Date, jobnetFile: JobnetFile): void {
        Common.trace(Common.STATE_DEBUG, 'scheduleJobnetsが実行されました。');
        for (const jobnetJson of jobnetFile.jobnets) {
            // 実行対象か
            if (!jobnetJson.enable) {
                Common.trace(Common.STATE_DEBUG, `${jobnetJson.name}は無効のためスケジューリングされません。`);
                continue;
            }

            // 実行月か？
            if (!Jobscheduler.isWorkMonth(targetDate.getMonth() + 1, jobnetJson.schedule.month.operation, jobnetJson.schedule.month.work)) {
                continue;
            }

            // 実行日か？
            if (!Jobscheduler.isWorkDay(targetDate.getDate(), targetDate.getDay(), jobnetJson.schedule.day.operation, jobnetJson.schedule.day.work, jobnetJson.schedule.day.weekday)) {
                continue;
            }

            // 開始時刻が定義されているか？
            if (!jobnetJson.schedule.start.enable) {
                throw new PoplarException(`${jobnetJson.name}の開始時刻が設定されていません。設定を確認してください。`);
            }

            // キューイングタイムの作成
            const queTime = new Date(targetDate);
            queTime.setHours(parseInt(jobnetJson.schedule.start.time.split(':')[0], 10), parseInt(jobnetJson.schedule.start.time.split(':')[1], 10), 0, 0);
            Common.trace(Common.STATE_DEBUG, `targetDate => ${targetDate.toLocaleString()}, queTime => ${queTime.toLocaleString()}`);

            // 既にスケジュール済みか？
            if (this.isExistJobnet(jobnetJson.name, queTime)) {
                Common.trace(Common.STATE_DEBUG, `${jobnetJson.name}を${queTime.toLocaleString()}にスケジュールしようとしましたが、既にスケジュールされていました。`);
                continue;
            }

            // 現在時刻より前か？
            if (queTime.getTime() < Date.now()) continue;

            // スケジュールに追加
            const serial = this.getSrial();
            this.jobnets.push(new Jobnet(serial, jobnetJson.name, jobnetJson.enable, jobnetJson.info, jobnetJson.schedule, queTime, jobnetJson.nextMatrix, jobnetJson.errorMatrix, Jobscheduler.jobJSON2jobarray(jobnetJson.jobs)));
            const waitTime = Date.now() < queTime.getTime() - Jobscheduler.PADDING_TIME ? queTime.getTime() - Jobscheduler.PADDING_TIME - Date.now() : -1;
            if (waitTime < 0) {
                this.startJobnet(serial);
            } else {
                setTimeout(() => { this.startJobnet(serial); }, waitTime);
            }

            Common.trace(Common.STATE_INFO, `${jobnetJson.name}（${serial}）を${queTime.toLocaleString()}にスケジュールしました。`);
        }
    }

    /**
     * ジョブネットが既にスケジュール済みかチェックする
     * @param name ジョブネット名
     * @param queTime キューイング時刻
     */
    public isExistJobnet(name: string, queTime: Date): boolean {
        Common.trace(Common.STATE_DEBUG, 'isExistJobnetが実行されました。');

        return this.jobnets.findIndex((jobnet: Jobnet): boolean => jobnet.name === name && jobnet.queTime.getTime() === queTime.getTime()) >= 0;
    }

    /**
     * JobJSONオブジェクトからJobオブジェクトに変換します
     * @param jobJson JobJSONオブジェクト
     */
    public static jobJSON2jobarray(jobJson: JobJSON[]): Job[] {
        Common.trace(Common.STATE_DEBUG, 'jobJSON2jobarrayが実行されました。');
        const jobs = new Array<Job>();
        for (const job of jobJson) {
            jobs.push(new Job(job.code, job.agentName, job.info, job.schedule, job.file, job.args));
        }

        return jobs;
    }

    /**
     * 実行月か確認をします
     * @param month 対象月
     * @param operation 選択肢
     * @param work 実行月リスト
     */
    public static isWorkMonth(month: number, operation: string, work: number[] | undefined): boolean {
        Common.trace(Common.STATE_DEBUG, 'isWorkMonthが実行されました。');
        switch (operation) {
            case Common.RUN_MONTH_EVERY:
                return true;

            case Common.RUN_MONTH_DESIGNATED:
                if (typeof work === 'undefined') {
                    throw new PoplarException('実行月に値が設定されていません。実行月を設定してください。');
                }

                return work.indexOf(month) >= 0;

            default:
                throw new PoplarException('実行月に「毎月」または「指定月」以外が設定されています。設定を確認してください。');
        }
    }

    /**
     * 実行日または実行曜日かを確認します
     * @param day 対象日
     * @param week 対象曜日
     * @param operation 選択肢
     * @param work 実行日リスト
     * @param weekday 実行曜日リスト
     */
    public static isWorkDay(day: number, week: number, operation: string, work: number[] | undefined, weekday: number[] | undefined): boolean {
        Common.trace(Common.STATE_DEBUG, 'isWorkDayが実行されました。');
        switch (operation) {
            case Common.RUN_DAY_DESIGNATED:
                if (typeof work === 'undefined') {
                    throw new PoplarException('実行日に値が設定されていません。実行日を設定してください。');
                }

                return work.indexOf(day) >= 0;

            case Common.RUN_DAY_DESIGNATED_WEEKDAY:
                if (typeof weekday === 'undefined') {
                    throw new PoplarException('実行曜日に値が設定されていません。実行曜日を設定してください。');
                }

                return weekday.indexOf(week) >= 0;

            case Common.RUN_DAY_EVERY:
                return true;

            case Common.RUN_DAY_HOLIDAY:
                // tslint:disable-next-line:no-magic-numbers
                return week === 0 || week === 6;

            case Common.RUN_DAY_WORKDAY:
                // tslint:disable-next-line:no-magic-numbers
                return week !== 0 && week !== 6;

            default:
                throw new PoplarException('実行日に「毎日」、「指定日」、「指定曜日」、「営業日」、「休日」以外が設定されています。設定を確認してください。');
        }
    }

    /**
     * ジョブネットを開始します。
     * @param serial ジョブネットシリアル番号
     */
    private startJobnet(serial: string): void {
        Common.trace(Common.STATE_DEBUG, 'startJobnetが実行されました。');
        const jobnet = this.findJobnet(serial);
        if (typeof jobnet === 'undefined') throw new PoplarException(`シリアル：${serial}が見つけられなかったため、ジョブネットを実行できませんでした。`);

        // startに設定されているジョブをキックする
        for (let nextjob = 1; nextjob < jobnet.nextMatrix[0].length; nextjob++) {
            if (jobnet.nextMatrix[0][nextjob] === 1) {
                jobnet.nextMatrix[nextjob][0] = 1;
                this.startJob(serial, jobnet.jobs[nextjob].code, false);
            }
        }
        jobnet.jobs[0].state = Common.STATE_FINISH;

        // 各ジョブの遅延監視、打切監視をセットする
        jobnet.jobs.forEach((job: Job): void => {
            let date: Date;
            const dTime = job.schedule.delay.enable ? job.schedule.delay.time : jobnet.schedule.delay.enable ? jobnet.schedule.delay.time : '';
            const kTime = job.schedule.deadline.enable ? job.schedule.deadline.time : jobnet.schedule.deadline.enable ? jobnet.schedule.deadline.time : '';

            // 遅延監視
            if (job.schedule.delay.enable || jobnet.schedule.delay.enable) {
                date = new Date(jobnet.queTime);
                try {
                    date.setHours(parseInt(dTime.split(':')[0], 10), parseInt(dTime.split(':')[1], 10), 0, 0);
                    jobnet.setTimer(setTimeout(() => { Jobscheduler.delayJob(serial, job); }, date.getTime() - Date.now() || 0));
                } catch (error) {
                    Common.trace(Common.STATE_ERROR, `${job.info}（${job.code}）の遅延監視時刻を正常に処理できなかったため、遅延監視は実施しません。`);
                    Common.trace(Common.STATE_DEBUG, error.stack);
                }
            }

            // 打ち切り監視
            if (job.schedule.deadline.enable || jobnet.schedule.deadline.enable) {
                date = new Date(jobnet.queTime);
                try {
                    date.setHours(parseInt(kTime.split(':')[0], 10), parseInt(kTime.split(':')[1], 10), 0, 0);
                    jobnet.setTimer(setTimeout(() => { this.killJob(serial, job); }, date.getTime() - Date.now() || 0));
                } catch (error) {
                    Common.trace(Common.STATE_ERROR, `${job.info}（${job.code}）の打切監視時刻を正常に処理できなかったため、打切監視は実施しません。`);
                    Common.trace(Common.STATE_DEBUG, error.stack);
                }
            }
        });

        Common.trace(Common.STATE_INFO, `${jobnet.name}（${serial}）を開始しました。`);
    }

    /**
     * ジョブネットの終了処理します。
     * @param serial ジョブネットシリアル番号
     */
    private finishJobnet(serial: string): void {
        Common.trace(Common.STATE_DEBUG, 'finishJobnetが実行されました。');
        const jobnet = this.findJobnet(serial);
        const log = './log';
        if (typeof jobnet === 'undefined') throw new PoplarException(`未定義のシリアル：${serial}が呼び出されました。`);

        jobnet.state = Common.STATE_FINISH;
        if (jobnet.jobs.findIndex((job: Job) => job.state === Common.STATE_FINISH_DELAY) >= 0) jobnet.state = Common.STATE_FINISH_DELAY;
        if (jobnet.jobs.findIndex((job: Job) => job.state === Common.STATE_FINISH_DEADLINE) >= 0) jobnet.state = Common.STATE_FINISH_DEADLINE;
        if (jobnet.jobs.findIndex((job: Job) => job.state === Common.STATE_FINISH_ERROR) >= 0) jobnet.state = Common.STATE_FINISH_ERROR;
        jobnet.finishTime = new Date();

        if (!fs.existsSync(log)) {
            fs.mkdirSync(log);
        }

        jobnet.clearTimer();
        fs.writeFile(`${log}/${serial}.json`, JSON.stringify(jobnet), (err: Error) => {
            if (err) {
                Common.trace(Common.STATE_ERROR, `${err.stack}`);
            } else {
                Common.trace(Common.STATE_INFO, `${jobnet.name}（${serial}）をログに書き出しました。`);
            }
        });

        this.delJobnet(serial);
    }

    /**
     * 遅延監視を行います。
     * @param serial ジョブネットシリアル番号
     * @param job ジョブ
     */
    private static delayJob(serial: string, job: Job): void {
        Common.trace(Common.STATE_DEBUG, 'delayJobが実行されました。');
        if (job.state === Common.STATE_FINISH) return;
        if (job.state === Common.STATE_FINISH_DELAY) return;
        if (job.state === Common.STATE_FINISH_ERROR) return;
        if (job.state === Common.STATE_FINISH_DEADLINE) return;
        if (job.state === Common.STATE_PASS) return;

        Common.trace(Common.STATE_WARN, `${job.info}（シリアル：${serial}、コード：${job.code}）が遅延監視時刻を超過しました。`);
    }

    /**
     * 打切監視を行います。
     * @param serial ジョブネットシリアル番号
     * @param job ジョブ
     */
    private killJob(serial: string, job: Job): void {
        Common.trace(Common.STATE_DEBUG, 'killJobが実行されました。');
        if (job.state === Common.STATE_KILLING) return;
        if (job.state === Common.STATE_FINISH) return;
        if (job.state === Common.STATE_FINISH_DELAY) return;
        if (job.state === Common.STATE_FINISH_ERROR) return;
        if (job.state === Common.STATE_FINISH_DEADLINE) return;
        if (job.state === Common.STATE_FINISH_KILLED) return;
        if (job.state === Common.STATE_PASS) return;

        Common.trace(Common.STATE_WARN, `${job.info}（シリアル：${serial}、コード：${job.code}）が打切監視時刻を超過しました。`);
        if (job.agentName !== Common.ENV_SERVER_HOST) {
            job.state = Common.STATE_SENDING_KILL;
            this.events.emit(Common.EVENT_KILL_JOB, Jobscheduler.getSerialJobJSON(serial, job), (isSuccessKill: boolean) => {
                if (isSuccessKill) job.state = Common.STATE_KILLING;
                else this.finishJob(serial, job.code, '500', '強制終了失敗。');
            });
        }
    }

    /**
     * ジョブ終了後の処理を実行します。
     * @param serial ジョブネットシリアル番号
     * @param jobcode ジョブコード
     * @param rc リターンコード
     * @param mes 実行結果メッセージ
     */
    public finishJob(serial: string, jobcode: string, rc?: string, mes?: string): void {
        Common.trace(Common.STATE_DEBUG, 'finishJobが実行されました。');
        const jobnet = this.findJobnet(serial);
        if (typeof jobnet === 'undefined') throw new PoplarException(`未定義のシリアル：${serial}が呼び出されました。`);

        const myjob = jobnet.getJobIndex(jobcode);
        if (myjob < 0) throw new PoplarException(`ジョブコード：${jobcode}のインデックスが取得できませんでした。`);
        const job = jobnet.jobs[myjob];

        // 後処理
        job.returnCode = rc;
        job.exceptionMes = mes;
        job.finishTime = new Date();

        const logstr = `${job.info}（シリアル：${serial}、コード：${job.code}）`;
        switch (rc) {
            case '0':
                // 正常終了
                job.state = Common.STATE_FINISH;

                // 遅延終了か？
                if (job.schedule.delay.enable) {
                    const time = job.schedule.delay.time;
                    const delay = new Date(jobnet.queTime);
                    const finish = job.finishTime || new Date();

                    try {
                        delay.setHours(parseInt(time.split(':')[0], 10), parseInt(time.split(':')[1], 10), 0, 0);
                    } catch (error) {
                        throw new PoplarException(`${logstr}の遅延監視時刻（${time}）を正常に文字列処理できませんでした。`, error.stack);
                    }
                    if (delay < finish) {
                        job.state = Common.STATE_FINISH_DELAY;
                        Common.trace(Common.STATE_WARN, `${logstr}は遅延終了しました。（RC=${rc}）`);
                    }
                }
                break;

            case '-1':
                // 打ち切り
                job.state = Common.STATE_FINISH_DEADLINE;
                Common.trace(Common.STATE_ERROR, `${logstr}は実行打切終了しました。（RC=${rc}）`);
                break;

            default:
                // リターンコードが0以外なら異常（-1は打ち切りで使う）
                job.state = Common.STATE_FINISH_ERROR;
                Common.trace(Common.STATE_ERROR, `${logstr}は異常終了しました。（RC=${rc}）`);
                break;
        }

        // 次のジョブをキック
        for (let nextjob = myjob + 1; nextjob < jobnet.jobs.length; nextjob++) {
            switch (job.state) {
                case Common.STATE_FINISH:
                case Common.STATE_FINISH_DELAY:
                case Common.STATE_FINISH_DEADLINE:
                    if (jobnet.nextMatrix[myjob][nextjob] === 1) {
                        jobnet.nextMatrix[nextjob][myjob] = 1;
                        this.startJob(serial, jobnet.jobs[nextjob].code, false);
                    }
                    break;
                default:
                    if (jobnet.errorMatrix[myjob][nextjob] === 1) {
                        jobnet.errorMatrix[nextjob][myjob] = 1;
                        this.startJob(serial, jobnet.jobs[nextjob].code, true);
                    }
                    break;
            }
        }
    }

    /**
     * ジョブの実行を開始します。
     * @param serial ジョブネットシリアル番号
     * @param jobcode 実行対象のジョブコード
     * @param isRecovery リカバリジョブか？
     */
    private startJob(serial: string, jobcode: string, isRecovery: boolean): void {
        Common.trace(Common.STATE_DEBUG, 'startJobが実行されました。');
        // ジョブネットの読み込み
        const jobnet = this.findJobnet(serial);
        if (typeof jobnet === 'undefined') throw new PoplarException(`未定義のシリアル：${serial}が呼び出されました。`);

        // jobの読み込み
        const job = jobnet.jobs.find((j: Job) => j.code === jobcode);
        if (typeof job === 'undefined') throw new PoplarException(`未定義のジョブコード：${jobcode}が呼び出されました。`);

        // リカバリーかつendなら終了
        if (isRecovery && jobcode === 'end') {
            job.state = Common.STATE_FINISH_ERROR;
            this.finishJobnet(serial);

            return;
        }

        // キュー時刻前か？
        if (Date.now() < jobnet.queTime.getTime()) {
            jobnet.setTimer(setTimeout(() => { this.startJob(serial, jobcode, isRecovery); }, jobnet.queTime.getTime() - Date.now()));

            return;
        }

        // 開始時刻後か？
        if (job.schedule.start.enable) {
            const start = job.schedule.start.time;
            const date = new Date(jobnet.queTime);
            try {
                date.setHours(parseInt(start.split(':')[0], 10), parseInt(start.split(':')[1], 10), 0, 0);
                if (Date.now() < date.getTime()) {
                    jobnet.setTimer(setTimeout(() => { this.startJob(serial, jobcode, isRecovery); }, date.getTime() - Date.now()));

                    return;
                }
            } catch (error) {
                Common.trace(Common.STATE_ERROR, `${job.info}（シリアル：${serial}、コード：${job.code}）の開始時刻を正常に処理できなかったため、開始時刻まで待機せずそのまま実行します。`);
                Common.trace(Common.STATE_DEBUG, error.stack);
            }
        }

        // 前ジョブが終わっているか
        const myjob = jobnet.getJobIndex(jobcode);
        for (let beforejob = 0; beforejob < jobnet.nextMatrix[myjob].length; beforejob++) {
            if (jobnet.nextMatrix[beforejob][myjob] === 1 && jobnet.nextMatrix[myjob][beforejob] === 0) {
                job.state = Common.STATE_WAITING_BEFORE_JOB;
                Common.trace(Common.STATE_INFO, `${job.info}（シリアル：${serial}、コード：${job.code}）は前ジョブの${jobnet.jobs[beforejob].info}（${jobnet.jobs[beforejob].code}）が終了していないため、終了まで待機します。`);
                Common.trace(Common.STATE_DEBUG, `${jobnet.jobs[beforejob].info}（${jobnet.jobs[beforejob].code}）のステータス：${jobnet.jobs[beforejob].state}`);

                return;
            }
        }

        // endjobか？
        if (jobcode === 'end') {
            job.state = Common.STATE_FINISH;
            this.finishJobnet(serial);

            return;
        }

        // 実行対象ではない場合「実行なし」をセットしジョブ終了処理に移る。
        if (!Jobscheduler.isWorkMonth(jobnet.queTime.getMonth() + 1, job.schedule.month.operation, job.schedule.month.work) || !Jobscheduler.isWorkDay(jobnet.queTime.getDate(), jobnet.queTime.getDay(), job.schedule.day.operation, job.schedule.day.work, job.schedule.day.weekday)) {
            job.state = Common.STATE_PASS;
            this.finishJob(serial, jobcode, '0', Common.STATE_PASS);

            return;
        }

        job.state = Common.STATE_SENDING_JOB;
        Common.trace(Common.STATE_INFO, `${job.info}（シリアル：${serial}、コード：${jobcode}）の開始指示を送信しました。`);
        this.events.emit(Common.EVENT_SEND_JOB, Jobscheduler.getSerialJobJSON(serial, job), (isSuccessStart: boolean) => {
            if (isSuccessStart) {
                job.state = Common.STATE_RUNNING;
                job.startTime = new Date();
                if (isRecovery) {
                    Common.trace(Common.STATE_WARN, `${job.info}（シリアル：${serial}、コード：${jobcode}）をリカバリジョブとして開始しました。`);
                } else {
                    Common.trace(Common.STATE_INFO, `${job.info}（シリアル：${serial}、コード：${jobcode}）を開始しました。`);
                }
            } else {
                job.state = Common.STATE_FINISH_ERROR;
                this.finishJob(serial, jobcode, '500', 'ジョブ開始に失敗しました。');
            }
        });
    }

    /**
     * シリアルジョブJSONを作成します。
     * @param serial ジョブネットシリアル番号
     * @param job ジョブ
     */
    private static getSerialJobJSON(serial: string, job: Job): SerialJobJSON {
        Common.trace(Common.STATE_DEBUG, 'getSerialJobJSONが実行されました。');
        const data: SerialJobJSON = {
            'agentName': job.agentName,
            'args': job.args,
            'code': job.code,
            'file': job.file,
            'info': job.info,
            'schedule': job.schedule,
            'serial': serial
        };

        return data;
    }

    /**
     * シリアル番号からジョブネットを検索します。
     * @param serial ジョブネットシリアル番号
     */
    public findJobnet(serial: string): Jobnet | undefined {
        Common.trace(Common.STATE_DEBUG, 'findJobnetが実行されました。');

        return this.jobnets.find((jobnet: Jobnet) => jobnet.serial === serial);
    }

    /**
     * シリアル番号からジョブネットを削除します。
     * @param serial ジョブネットシリアル番号
     */
    public delJobnet(serial: string): boolean {
        Common.trace(Common.STATE_DEBUG, 'delJobnetが実行されました。');

        return this.jobnets.some((jobnet: Jobnet, index: number) => {
            if (jobnet.serial === serial) {
                this.jobnets.splice(index, 1);

                return true;
            } else {
                return false;
            }
        });
    }

    /**
     * ジョブネット内から指定したジョブコードのジョブを検索します。
     * @param serial ジョブネットシリアル番号
     * @param jobcode ジョブコード
     */
    public findJob(serial: string, jobcode: string): Job | undefined {
        Common.trace(Common.STATE_DEBUG, 'findJobが実行されました。');

        const jobnet = this.findJobnet(serial);
        if (typeof jobnet === 'undefined') return undefined;

        return jobnet.jobs.find((job: Job) => job.code === jobcode);
    }

    /**
     * 実行中以外のジョブネットを削除します。
     */
    public deleteWaitingJobnet(): void {
        this.jobnets.forEach((jobnet: Jobnet) => {
            if (jobnet.state !== Common.STATE_RUNNING) {
                const str = `${jobnet.info}（${jobnet.serial}）を削除`;
                if (this.delJobnet(jobnet.serial)) {
                    Common.trace(Common.STATE_INFO, `${str}しました。`);
                } else {
                    Common.trace(Common.STATE_ERROR, `${str}できませんでした。`);
                }
            }
        });
    }
}
