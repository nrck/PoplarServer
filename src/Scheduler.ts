import { IResponse, BaseController } from './Models/BaseController';
import { PoplarException } from './Models/PoplarException';
import { RunJobnet } from './Models/RunJobnet';
import { RunJobnetController } from './Models/RunJobnetController';
import { SERVER_ERROR } from './Models/Types/HttpStateCode';
import { loadConfig } from './Util/Config';
import * as log from './Util/Log';
import { MasterJobController } from './Models/MasterJobController';
import { MasterJobnet } from './Models/MasterJobnet';

export const config = loadConfig();
export const queueWaitingTime = config.queueWaitingTime as number;

/**
 * Job Working!!
 */
export class Scheduler {
    /** True: This instance will scheduling to jobnets automatically by the interval. */
    public isEnableAutomaticallyScheduling: boolean;

    constructor() {
        // 自動再スケジュールをONにする
        this.isEnableAutomaticallyScheduling = config.isAutoSchedule as boolean;

        // RunJobnetを読み込んでタイマーをセットする
        this.ResumeRunningJobnets()
            .then(() => log.info('RunJobnet is roaded.'))
            .catch((reason: any) => {
                if (reason instanceof Error) throw new PoplarException(reason.message, reason.stack);
            });

        // 初回スケジュール
        this.DoSchedule();
    }

    /**
     * Resume runnning jobnets
     */
    private async ResumeRunningJobnets(): Promise<void> {
        const promise = RunJobnetController.getQueue()
            .then((respons: IResponse<RunJobnet>): void => {
                log.info('%s Total:%d', respons.message, respons.total);
                const jobnets = respons.entity as RunJobnet[];
                jobnets.forEach((jobnet: RunJobnet): void => {
                    jobnet.sleep()
                        .then(() => this.startJobnet())
                        // tslint:disable-next-line: no-any
                        .catch((reason: any) => log.error(reason));
                });
            })
            .catch((reason: IResponse<RunJobnet>): void => {
                if (reason.state === SERVER_ERROR) {
                    log.error(reason.message);
                } else {
                    log.warn(reason.message);
                }
            });

        return promise;
    }


    private async DoSchedule(): Promise<void> {
        log.trace();
        // マスタージョブネットを読み込む
        const res = await BaseController.all(MasterJobnet, {});
        const jobnets = res.entity as MasterJobnet[];
        log.info('%s State:%d Total:%d', res.message, res.state, res.total);

        for (const jobnet of jobnets) {
            // 実行対象か
            if (jobnet.enable) {
                log.warn('%s is Disenable. The jobnnet do not schedule.', jobnet.name);
                continue;
            }

            // 実行月か？
            if (!Jobscheduler.isWorkMonth(targetDate.getMonth() + 1, jobnet.schedule.month.operation, jobnet.schedule.month.work)) {
                continue;
            }

            // 実行日か？
            if (!Jobscheduler.isWorkDay(targetDate.getDate(), targetDate.getDay(), jobnet.schedule.day.operation, jobnet.schedule.day.work, jobnet.schedule.day.weekday)) {
                continue;
            }

            // 開始時刻が定義されているか？
            if (!jobnet.schedule.start.enable) {
                throw new PoplarException(`${jobnet.name}の開始時刻が設定されていません。設定を確認してください。`);
            }

            // キューイングタイムの作成
            const queTime = new Date(targetDate);
            queTime.setHours(parseInt(jobnet.schedule.start.time.split(':')[0], 10), parseInt(jobnet.schedule.start.time.split(':')[1], 10), 0, 0);
            Common.trace(Common.STATE_DEBUG, `targetDate => ${targetDate.toLocaleString()}, queTime => ${queTime.toLocaleString()}`);

            // 既にスケジュール済みか？
            if (this.isExistJobnet(jobnet.name, queTime)) {
                Common.trace(Common.STATE_DEBUG, `${jobnet.name}を${queTime.toLocaleString()}にスケジュールしようとしましたが、既にスケジュールされていました。`);
                continue;
            }

            // 現在時刻より前か？
            if (queTime.getTime() < Date.now()) continue;

            // スケジュールに追加
            const serial = this.getSrial();
            this.jobnets.push(new Jobnet(serial, jobnet.name, jobnet.enable, jobnet.info, jobnet.schedule, queTime, jobnet.nextMatrix, jobnet.errorMatrix, Jobscheduler.jobJSON2jobarray(jobnet.jobs)));
            this.setTimeoutStartJobnet(serial);
        }
        this.writeJobnet(this.jobnets, this.serial);
        return;
    }

    private startJobnet(): void {
        log.trace();
        return;
    }
}
