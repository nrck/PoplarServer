import { Column, Entity } from 'typeorm';
import { PoplarException } from '../poplarException';
import { RunDate } from './interface';
import { IMasterJob, MasterJob, TMasterJobConstractOptions } from './MasterJob';

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
     * @param masterJob Master job
     */
    public builder(masterJob: MasterJob): MasterJob;

    /**
     * Master job constructor
     * @param agentID Target agent ID
     * @param info Jobs describe
     * @param schedule Execute schedule
     * @param options Construct options. True: This job is Control job. string: File path(Shell or bat).
     */
    public builder(agentID: number, info: string, schedule: RunDate, options?: TMasterJobConstractOptions): MasterJob;

    /**
     * Master job constructor
     * @param masterJobOrAgentID Master job or Target agent ID
     * @param info Jobs describe
     * @param schedule Execute schedule
     * @param options Construct options. True: This job is Control job. string: File path(Shell or bat).
     */
    public builder(masterJobOrAgentID: MasterJob | number, info?: string, schedule?: RunDate, options?: TMasterJobConstractOptions): MasterJob {
        if (typeof masterJobOrAgentID === 'number') {
            if (info === undefined) throw new PoplarException('Information is required.');
            if (schedule === undefined) throw new PoplarException('RunDate is required.');
            super.builder(masterJobOrAgentID, info, schedule, options);
        } else {
            this.agentID = masterJobOrAgentID.agentID;
            this.args = masterJobOrAgentID.args;
            this.cwd = masterJobOrAgentID.cwd;
            this.file = masterJobOrAgentID.file;
            this.info = masterJobOrAgentID.info;
            this.isControlJob = masterJobOrAgentID.isControlJob;
            this.schedule = masterJobOrAgentID.schedule;
        }
        this.state = 'WaitingStartTime';

        return this;
    }
}
