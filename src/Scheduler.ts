import * as Moment from 'moment';
import { IResponse } from './Models/BaseController';
import { JobnetNode } from './Models/JobnetNode';
import { MasterJobController } from './Models/MasterJobController';
import { MasterJobnet } from './Models/MasterJobnet';
import { PoplarException } from './Models/PoplarException';
import { RunJob } from './Models/RunJob';
import { RunJobController } from './Models/RunJobController';
import { RunJobnet } from './Models/RunJobnet';
import { RunJobnetController } from './Models/RunJobnetController';
import { SERVER_ERROR } from './Models/Types/HttpStateCode';
import { loadConfig } from './Util/Config';
import * as log from './Util/Log';
import { runDateToMoment } from './Util/MomentUtil';


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
            .then(async () => this.initSchedulleJobnets())
            .then(() => {
                this.rerunScheduleTimer = setTimeout(() => { this.rerunSchedule(); }, loadConfig().autoScheduleIntervalTime);
            })
            // tslint:disable-next-line: no-any
            .catch((error: any) => {
                if (error instanceof Error) throw new PoplarException(error.message, error.stack);
                log.error(error);
            });
    }

    private async initSchedulleJobnets(): Promise<void> {
        for (let i = 0; i < loadConfig().autoScheduleDays; i++) {
            const date = Moment().startOf('day').add(i, 'day').toDate();
            await this.doSchedule(date);
        }
        log.info('Schedule init is success.');
    }

    /**
     * Resume runnning jobnets
     */
    private async resumeRunningJobnets(): Promise<void> {
        const promise = RunJobnetController.getQueue()
            .then((respons: IResponse<RunJobnet>): void => {
                log.debug('%s Total:%d', respons.message, respons.total);
                const jobnets = respons.entity as RunJobnet[];
                jobnets.forEach((jobnet: RunJobnet): void => {
                    if (Moment.isDate(jobnet.finishTime)) return;
                    jobnet.sleep()
                        .then(async () => this.startJobnet(jobnet.id))
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
                log.warn('%s\'s start time is undefined.', jobnet.name);
                continue;
            }

            // 既にスケジュール済みか？
            const queTime = runDateToMoment(targetDate, jobnet.schedule.start);
            const isExistRunJobnet = await RunJobnetController.isExistRunJobnet(jobnet.name, queTime.toDate());
            if (isExistRunJobnet) {
                log.warn('%s is scheduled already at %s.', jobnet.name, queTime.format('YYYY-MM-DD HH:mm'));
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
                        .then(async () => this.startJobnet(newrun.id))
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
            log.info('Auto scheduling is started.');
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

    /**
     * start jobnet
     * @param jobnet target runjobnet
     */
    private async startJobnet(jobnetId: number): Promise<void> {
        // Get runjobnet data from DB.
        log.trace('Get runjobnet ID:%d data from DB.', jobnetId);
        const res = await RunJobnetController.get(RunJobnet, jobnetId);
        if (res.total !== 1) {
            throw new PoplarException(`ID:${jobnetId} is not one.`);
        }
        const jobnet = res.entity as RunJobnet;
        log.trace('[%d]%s will be starting.', jobnet.id, jobnet.name);

        // check state
        switch (jobnet.state) {
            // finish
            case 'Deadline':
            case 'Delay':
            case 'Error':
            case 'Finish':
            case 'Killed':
                log.warn('[%d]%s was finished!!', jobnet.id, jobnet.name);

                return;
            // running
            case 'Killing':
            case 'Pass':
            case 'SendingJob':
            case 'SendingSIGKILL':
            case 'Running':
            case 'WaitingPreviousJob':
                log.warn('[%d]%s was started!!', jobnet.id, jobnet.name);

                return;
            // pause
            case 'Pause':
                log.info('[%d]%s is PAUSING. It does not start.', jobnet.id, jobnet.name);

                return;
                break;
            // waiting
            case 'WaitingStartTime':
                break;
            default:
                throw new PoplarException(`Undefined state: ${jobnet.state}.`);
        }

        // change state
        jobnet.state = 'Running';
        jobnet.startTime = Moment().toDate();
        await RunJobnetController.save(jobnet);

        // check nodes
        if (jobnet.nodes === undefined || jobnet.nodes.length === 0) {
            log.warn('[%d]%s does NOT has nodes.', jobnet.id, jobnet.name);
            this.finishJobnet(jobnet).then().catch();

            return;
        }

        jobnet.nodes.forEach((node: JobnetNode) => {
            const runjob = RunJob.builder(node.sourceJob, jobnet.id, node.id);
            if (node.sourceJob.id === 1) {
                RunJobController.save(runjob)
                    .then((saved: IResponse<RunJob>) => {
                        const job = saved.entity as RunJob;
                        this.startJob(job.id);
                    })
                    .catch((reason: any) => {
                        throw reason;
                    });
            } else {
                RunJobController.save(runjob)
                    .then((saved: IResponse<RunJob>) => {
                        const job = saved.entity as RunJob;

                        // deadline
                        let deadline = Moment(jobnet.queTime).add(1, 'day').valueOf();
                        if (job.schedule.deadline !== undefined) {
                            deadline = runDateToMoment(jobnet.queTime, job.schedule.deadline).valueOf() - Date.now();
                        } else if (jobnet.schedule.deadline !== undefined) {
                            deadline = runDateToMoment(jobnet.queTime, jobnet.schedule.deadline).valueOf() - Date.now();
                        }
                        job.deadLineTimer = setTimeout(() => { }, deadline < 0 ? 0 : deadline);

                        // delay
                        if (job.schedule.delay !== undefined) {
                            const delay = runDateToMoment(jobnet.queTime, job.schedule.delay).valueOf() - Date.now();
                            job.delayTimer = setTimeout(() => { }, delay < 0 ? 0 : delay);
                        }
                    })
                    .catch((reason: any) => {
                        throw reason;
                    });
            }
        });
        log.trace('[%d]%s is started.', jobnet.id, jobnet.name);

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

    private startJob(jobId: number): void {
        log.trace();

    }
}
