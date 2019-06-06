import { Column, Entity } from 'typeorm';
import { IMasterJob, MasterJob } from './MasterJob';

export interface IRunJob extends IMasterJob {
    /** Jobs state */
    state: JobState;
    /** return code */
    returnCode?: string;
    /** standard output data */
    stdout?: string;
    /** standard error data */
    stderr?: string;
    /** excute start time */
    startTime?: Date;
    /** excute finish time */
    finishTime?: Date;
}

/**
 * RunJob class. this class extend MasterJob
 */
@Entity()
export class RunJob extends MasterJob implements IRunJob {
    /** Jobs state */
    @Column('text', { 'nullable': false })
    public state: JobState;

    /** return code */
    @Column('text')
    public returnCode: string | undefined;

    /** standard output data */
    @Column('text')
    public stdout: string | undefined;

    /** standard error data */
    @Column('text')
    public stderr: string | undefined;

    /** excute start time */
    @Column('Date')
    public startTime: Date | undefined;

    /** excute finish time */
    @Column('Date')
    public finishTime: Date | undefined;

    constructor(masterJob: MasterJob) {
        super(masterJob.agentID, masterJob.info, masterJob.schedule, { 'args': masterJob.args, 'cwd': masterJob.cwd, 'file': masterJob.file });
        this.state = 'WaitingStartTime';
    }
}
