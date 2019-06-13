import { Column, Entity } from 'typeorm';
import { IMasterJobnet, MasterJobnet } from './MasterJobnet';
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
}
