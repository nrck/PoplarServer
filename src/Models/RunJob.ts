import { Column, Entity } from 'typeorm';
import { IMasterJob, MasterJob } from './MasterJob';

export interface IRunJob extends IMasterJob {
    /** ジョブの状態 */
    state: JobState;
    /** リターンコード */
    returnCode?: string;
    /** 標準出力 */
    stdout?: string;
    /** 標準エラー */
    stderr?: string;
    /** 実開始時刻 */
    startTime?: Date;
    /** 実終了時刻 */
    finishTime?: Date;
}

@Entity()
export class RunJob extends MasterJob implements IRunJob {
    @Column('text', { 'nullable': false })
    public state: JobState;

    @Column('text')
    public returnCode: string | undefined;

    @Column('text')
    public stdout: string | undefined;

    @Column('text')
    public stderr: string | undefined;

    @Column('Date')
    public startTime: Date | undefined;

    @Column('Date')
    public finishTime: Date | undefined;

    constructor(masterJob: MasterJob) {
        super(masterJob.agentID, masterJob.info, masterJob.schedule, { 'args': masterJob.args, 'cwd': masterJob.cwd, 'file': masterJob.file });
        this.state = 'WaitingStartTime';
    }
}
