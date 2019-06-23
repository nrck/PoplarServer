import { BaseEntity, Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Agent } from './Agent';
import { RunDate } from './Interface/RunDate';
import { JobnetNode } from './JobnetNode';

export interface IMasterJob {
    /** Taraget agent */
    agent: Agent;
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

    /** Taraget agent */
    // tslint:disable-next-line: typedef
    @ManyToOne(_type => Agent, (agent: Agent) => agent.jobs, { 'onDelete': 'RESTRICT', 'nullable': false })
    public agent!: Agent;

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

    /** This MasterJob is contained in the JobnetNodes */
    // tslint:disable-next-line: typedef
    @OneToMany(_type => JobnetNode, (jobnetNode: JobnetNode) => jobnetNode.sourceJob, { 'onDelete': 'SET NULL' })
    public nodeSources: JobnetNode[] | undefined;

    /** This MasterJob is contained in the JobnetNodes */
    // tslint:disable-next-line: typedef
    @OneToMany(_type => JobnetNode, (jobnetNode: JobnetNode) => jobnetNode.targetSuccessJob, { 'onDelete': 'SET NULL' })
    public nodeTargetSuccesses: JobnetNode[] | undefined;

    /** This MasterJob is contained in the JobnetNodes */
    // tslint:disable-next-line: typedef
    @OneToMany(_type => JobnetNode, (jobnetNode: JobnetNode) => jobnetNode.targetErrorJob, { 'onDelete': 'SET NULL' })
    public nodeTargetErrors: JobnetNode[] | undefined;
}
