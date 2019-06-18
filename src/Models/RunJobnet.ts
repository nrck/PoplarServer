import { Column, Entity } from 'typeorm';
import { queueWaitingTime } from '../Scheduler';
import * as log from '../Util/Log';
import { IBaseResponse } from './Interface/Response';
import { IMasterJobnet, MasterJobnet } from './MasterJobnet';
import { GONE } from './Types/HttpStateCode';
import { JobState } from './Types/State';

export interface IRunJobnet extends IMasterJobnet {
    /** Jobs state */
    state: JobState;
    /** excute start time */
    startTime?: Date;
    /** excute finish time */
    finishTime?: Date;
    /** Que time. */
    queTime: Date;
    /** Result message. undefined is not finished. */
    result?: string;
}

/** RunJobnet class. */
@Entity()
export class RunJobnet extends MasterJobnet implements IRunJobnet {
    /** Jobnet state */
    @Column('text', { 'nullable': false })
    public state!: JobState;

    /** Start time. undefined is not started. */
    @Column('datetime')
    public startTime: Date | undefined;

    /** Finish time. undefined is not finished. */
    @Column('datetime')
    public finishTime: Date | undefined;

    /** Que time. */
    @Column('datetime', { 'nullable': false })
    public queTime!: Date;

    /** Result message. undefined is not finished. */
    @Column('text')
    public result: string | undefined;

    /** Timer handler */
    private _queueTimer?: NodeJS.Timeout;

    /** Sleep Promise object */
    private _sleepPromise?: Promise<void>;

    /** Function of reject to Sleep Promise */
    private _sleepReject?: (reason: IBaseResponse) => void;

    /**
     * Run jobnet constructor
     * @param masterJobnet Master Jobnet
     * @param queTime QueTime
     */
    public static builder(masterJobnet: MasterJobnet, queTime: Date): RunJobnet {
        const runJobnet = new RunJobnet();
        runJobnet.info = masterJobnet.info;
        runJobnet.name = masterJobnet.name;
        runJobnet.nodes = masterJobnet.nodes;
        runJobnet.schedule = masterJobnet.schedule;
        runJobnet.enable = masterJobnet.enable;

        runJobnet.state = 'WaitingStartTime';
        runJobnet.queTime = queTime;

        return runJobnet;
    }

    /**
     * Sleep until start time.
     */
    public async sleep(): Promise<void> {
        const wait = Date.now() - this.queTime.getMilliseconds() - queueWaitingTime;
        if (this._sleepPromise !== undefined) return this._sleepPromise;

        this._sleepPromise = new Promise((resolve: () => void, reject: (reason: IBaseResponse) => void): void => {
            this._sleepReject = reject;
            if (wait <= 0) {
                resolve();
            } else {
                this._queueTimer = setTimeout(resolve, wait);
            }
        });

        return this._sleepPromise;
    }

    /**
     * Sleep timer cancel and reject promise.
     */
    public cliarTimer(): void {
        if (this._queueTimer === undefined) return;
        clearTimeout(this._queueTimer);
        log.warn('Sleep canceled (jobnet name:%s ID:%d)', this.name, this.id);
        if (this._sleepPromise === undefined) return;
        if (this._sleepReject === undefined) return;
        this._sleepReject({ 'message': 'Sleep canceled.', 'state': GONE, 'timestamp': new Date(), 'total': 0 });
    }
}
