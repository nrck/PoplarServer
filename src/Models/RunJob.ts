import { Column, Entity } from 'typeorm';
import { PoplarException } from '../poplarException';
import { Agent } from './Agent';
import { RunDate } from './interface';
import { IMasterJob, MasterJob, TMasterJobConstractOptions } from './MasterJob';
import { JobState } from './Types/State';

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
    public state!: JobState;

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
    @Column('datetime')
    public startTime: Date | undefined;

    /** excute finish time */
    @Column('datetime')
    public finishTime: Date | undefined;

    /**
     * Master job constructor
     * @param masterJobOrAgent Master job. Builder function DO NOT support args of Agent type.
     * @param _info DO NOT USE
     * @param _schedule DO NOT USE
     * @param _options DO NOT USE
     */
    public builder(masterJobOrAgent: MasterJob | Agent, _info?: string, _schedule?: RunDate, _options?: TMasterJobConstractOptions): RunJob {
        if (masterJobOrAgent.constructor.name === 'Agent') throw new PoplarException('Builder function DO NOT support args of Agent type.');
        const masterJob = masterJobOrAgent as MasterJob;
        this.agent = masterJob.agent;
        this.args = masterJob.args;
        this.cwd = masterJob.cwd;
        this.file = masterJob.file;
        this.info = masterJob.info;
        this.isControlJob = masterJob.isControlJob;
        this.schedule = masterJob.schedule;
        this.state = 'WaitingStartTime';

        return this;
    }
}
