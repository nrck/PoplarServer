import { Column, Entity } from 'typeorm';
import { IMasterJob, MasterJob } from './MasterJob';
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
    runJobnetId: number;
    nodeId: number;
}

/**
 * RunJob class. this class extend MasterJob
 */
@Entity()
export class RunJob extends MasterJob implements IRunJob {

    @Column('int', { 'nullable': false })
    public runJobnetId!: number;
    @Column('int', { 'nullable': false })
    public nodeId!: number;
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
     * @param masterJob Master job.
     */
    public static builder(masterJob: MasterJob, runJobnetId: number, nodeId: number): RunJob {
        const runJob = new RunJob();
        runJob.agent = masterJob.agent;
        runJob.args = masterJob.args;
        runJob.cwd = masterJob.cwd;
        runJob.file = masterJob.file;
        runJob.info = masterJob.info;
        runJob.isControlJob = masterJob.isControlJob;
        runJob.schedule = masterJob.schedule;
        runJob.state = 'WaitingStartTime';
        runJob.runJobnetId = runJobnetId;
        runJob.nodeId = nodeId;

        return runJob;
    }
}
