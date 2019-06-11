import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { RunDate } from './interface';

export interface IMasterJobOption {
    /** File path(Shell or bat) */
    file: string;
    /** Exqute args */
    args?: string;
    /** Executed at this current work directory. */
    cwd?: string;
}

export interface IMasterJob {
    /** Taraget agent ID */
    agentID: number;
    /** Jobs describe */
    info: string;
    /** Execute schedule */
    schedule: RunDate;
    /** Enabele: This job is Control job. */
    isControlJob: boolean;
    /** File path(Shell or bat) */
    file: string;
    /** Executed at this current work directory. */
    cwd: string;
    /** Exqute args */
    args: string;
}

export declare type TMasterJobConstractOptions = true | string | IMasterJobOption;

/**
 * Master Job. This class extend BaseEntity.
 */
@Entity()
export class MasterJob extends BaseEntity implements IMasterJob {
    /** Master Job ID. This is primary key */
    @PrimaryGeneratedColumn()
    public readonly id!: number;

    /** Enabele: This job is Control job. */
    @Column('boolean', { 'nullable': false })
    public isControlJob = false;

    /** Executed at this current work directory. Defalt is './' */
    @Column('text')
    public cwd = './';

    /** Taraget agent ID */
    @Column('int', { 'nullable': false })
    public agentID = 0;

    /** Jobs describe */
    @Column('text')
    public info = '';

    /** Execute schedule */
    @Column('simple-json', { 'name': 'schedule', 'nullable': false })
    public schedule!: RunDate;

    /** File path(Shell or bat) */
    @Column('text')
    public file = '';

    /** Exqute args */
    @Column('text')
    public args = '';

    /**
     * Master job constructor
     * @param agentID Master job or Target agent ID
     * @param info Jobs describe
     * @param schedule Execute schedule
     * @param options Construct options. True: This job is Control job. string: File path(Shell or bat).
     */
    public builder(agentID: number, info: string, schedule: RunDate, options?: TMasterJobConstractOptions): MasterJob {
        this.agentID = agentID;
        this.info = info;
        this.schedule = schedule;
        if (typeof options === 'string') {
            this.file = options;
        } else if (typeof options === 'boolean') {
            this.isControlJob = true;
        } else if (options !== undefined) {
            this.file = options.file;
            this.cwd = options.cwd === undefined ? './' : options.cwd;
            this.args = options.args === undefined ? '' : options.args;
        }

        return this;
    }
}
