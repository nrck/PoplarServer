import { IResponse } from './Models/BaseController';
import { PoplarException } from './Models/PoplarException';
import { RunJobnet } from './Models/RunJobnet';
import { RunJobnetController } from './Models/RunJobnetController';
import { SERVER_ERROR } from './Models/Types/HttpStateCode';
import { loadConfig } from './Util/Config';
import * as log from './Util/Log';

export const queueWaitingTime = loadConfig().queueWaitingTime as number;

/**
 * Job Working!!
 */
export class Scheduler {
    /** True: This instance will scheduling to jobnets automatically by the interval. */
    public isEnableAutomaticallyScheduling: boolean;

    constructor() {
        // 自動再スケジュールをONにする
        this.isEnableAutomaticallyScheduling = loadConfig().isAutoSchedule as boolean;

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


    private DoSchedule(): void {
        log.trace();
        return;
    }

    private startJobnet(): void {
        log.trace();
        return;
    }
}
