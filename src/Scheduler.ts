import * as Moment from 'moment';
import { IResponse } from './Models/BaseController';
import { MasterJobController } from './Models/MasterJobController';
import { MasterJobnet } from './Models/MasterJobnet';
import { PoplarException } from './Models/PoplarException';
import { RunJobnet } from './Models/RunJobnet';
import { RunJobnetController } from './Models/RunJobnetController';
import { SERVER_ERROR } from './Models/Types/HttpStateCode';
import { loadConfig } from './Util/Config';
import * as log from './Util/Log';
import { JobnetNode } from './Models/JobnetNode';
import { RunJob } from './Models/RunJob';
import { RunJobController } from './Models/RunJobController';


/**
 * Job Working!!
 */
export class Scheduler {
    /** True: This instance will scheduling to jobnets automatically by the interval. */
    public isEnableAutomaticallyScheduling: boolean;

    private rerunScheduleTimer: NodeJS.Timer | undefined;

    constructor() {
        // 自動再スケジュールをONにする
        this.isEnableAutomaticallyScheduling = loadConfig().isAutoSchedule;

        // RunJobnetを読み込んでタイマーをセットする
        this.resumeRunningJobnets()
            .then(() => log.info('RunJobnet is roaded.'))
            .catch((reason: any) => {
                if (reason instanceof Error) throw new PoplarException(reason.message, reason.stack);
            })
            .then(async () => {
                // 初回スケジュール
                for (let i = 0; i < loadConfig().autoScheduleDays; i++) {
                    const date = Moment().startOf('day').add(i, 'day').toDate();
                    await this.doSchedule(date);
                }
                log.info('Schedule init is success.');
            })
            .then(() => {
                this.rerunScheduleTimer = setTimeout(() => { this.rerunSchedule(); }, loadConfig().autoScheduleIntervalTime);
            })
            .catch((error: any) => {
                log.error(error);
            });
    }

    /**
     * Resume runnning jobnets
     */
    private async resumeRunningJobnets(): Promise<void> {
        const promise = RunJobnetController.getQueue()
            .then((respons: IResponse<RunJobnet>): void => {
                log.info('%s Total:%d', respons.message, respons.total);
                const jobnets = respons.entity as RunJobnet[];
                jobnets.forEach((jobnet: RunJobnet): void => {
                    if (jobnet.finishTime !== undefined) return;
                    jobnet.sleep()
                        .then(() => this.startJobnet(jobnet))
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


    private async doSchedule(targetDate: Date): Promise<void> {
        // マスタージョブネットを読み込む
        const res = await MasterJobController.all(MasterJobnet, {})
            .catch((err: IResponse<MasterJobnet>): IResponse<MasterJobnet> => {
                if (err.state === SERVER_ERROR) {
                    throw new PoplarException(err.message);
                }
                log.warn(err.message);

                return err;
            });
        const jobnets = res.entity as MasterJobnet[];
        if (jobnets.length === 0) return;

        log.debug('%s State:%d Total:%d', res.message, res.state, res.total);
        for (const jobnet of jobnets) {
            // 実行対象か
            if (!jobnet.enable) {
                log.info('%s is Disenable. The jobnnet do not schedule.', jobnet.name);
                continue;
            }

            // 実行日か？
            if (!jobnet.isWork(targetDate)) {
                log.info('%s is not working day in %s. The jobnnet do not schedule.', jobnet.name, Moment(targetDate).format('YYYY-MM-DD'));
                continue;
            }

            // 開始時刻が定義されているか？
            if (jobnet.schedule.start === undefined) {
                throw new PoplarException(`${jobnet.name}'s start time is undefined.`);
            }

            // 既にスケジュール済みか？
            const hhmm = jobnet.schedule.start.split(':');
            const hh = parseInt(hhmm[0], 10);
            const mm = parseInt(hhmm[1], 10);
            const queTime = Moment(targetDate).startOf('day').hour(hh).minute(mm);
            const isExistRunJobnet = await RunJobnetController.isExistRunJobnet(jobnet.name, queTime.toDate());
            if (isExistRunJobnet) {
                log.warn('%s is scheduled already at %s.', jobnet.name, queTime.format('YYYY-MM-DD hh:mm'));
                continue;
            }

            // 現在時刻より前か？
            if (queTime.valueOf() < Date.now()) {
                continue;
            }

            // スケジュールに追加
            const newrun = RunJobnet.builder(jobnet, queTime.toDate());
            RunJobnetController.add(RunJobnet, newrun)
                .then((): void => {
                    newrun.sleep()
                        .then(() => this.startJobnet(newrun))
                        // tslint:disable-next-line: no-any
                        .catch((reason: any) => log.error(reason));
                })
                .catch((reason: any): void => {
                    throw reason;
                });
        }
    }

    /**
     * Auto scheduling
     */
    public rerunSchedule(): void {
        if (this.isEnableAutomaticallyScheduling) {
            log.info('Auto scheduling is started.')
            // 当日～SCAN_RANGEは再スケジューリングしない仕様
            const date = Moment().add(loadConfig().autoScheduleDays, 'days').toDate();
            this.doSchedule(date)
                .then(() => {
                    if (this.rerunScheduleTimer !== undefined) clearTimeout(this.rerunScheduleTimer);
                    this.rerunScheduleTimer = setTimeout(() => { this.rerunSchedule(); }, loadConfig().autoScheduleIntervalTime);
                    log.info('Auto scheduling is finished.');
                })
                .catch((error: any) => {
                    log.error('Error was happen at auto scheduling.');
                    throw error;
                });
        }
    }

    private async startJobnet(jobnet: RunJobnet): Promise<void> {
        log.trace('[%d]%s will be starting', jobnet.id, jobnet.name);
        if (jobnet.state === 'Running') {
            log.warn('[%d]%s was started!!', jobnet.id, jobnet.name);

            return;
        }

        jobnet.state = 'Running';
        jobnet.startTime = Moment().toDate();
        RunJobnetController.save(jobnet).then(() => { log.info('RunJobnet saved'); }).catch();
        if (jobnet.nodes === undefined || jobnet.nodes.length === 0) {
            log.error('[%d]%s does NOT has nodes.', jobnet.id, jobnet.name);
            this.finishJobnet(jobnet);

            return;
        }
        jobnet.nodes.forEach((node: JobnetNode) => {
            if (node.sourceJob.id !== 1) return;
            const runjob = RunJob.builder(node.sourceJob, jobnet.id, node.id);
            RunJobController.save(runjob).then(() => { log.info('RunJob saved'); }).catch();
        });

        return;
    }

    private async finishJobnet(jobnet: RunJobnet): Promise<void> {
        log.trace('[%d]%s will be finishing', jobnet.id, jobnet.name);
        jobnet.state = 'Finish';
        jobnet.finishTime = Moment().toDate();
        await RunJobnetController.save(jobnet);
        log.info('[%d]%s is finished', jobnet.id, jobnet.name);

        return;
    }
}
