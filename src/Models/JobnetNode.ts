import { BaseEntity, Entity, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { MasterJob } from './MasterJob';
import { MasterJobnet } from './MasterJobnet';

export interface IJobnetNode {
    /** ID of the jobnet that contains this node. */
    masterJobnet: MasterJobnet;
    /** ID is the sourece job of this node. */
    sourceJob: MasterJob;
    /** ID is the target job(at SUCCESS) of this node. */
    targetSuccessJob: MasterJob;
    /** ID is the target job(at ERROR) of this node. */
    targetErrorJob: MasterJob;
}

/**
 * Jobnet Node
 */
@Entity()
@Unique('UQ_JOBNET_NODE', ['masterJobnet', 'sourceJob', 'targetSuccessJob'])
export class JobnetNode extends BaseEntity implements IJobnetNode {
    /** This column is Primary key */
    @PrimaryGeneratedColumn()
    public readonly id!: number;

    /** ID of the jobnet that contains this node. */
    // tslint:disable-next-line: typedef
    @ManyToOne(_type => MasterJobnet, (masterJobnet: MasterJobnet) => masterJobnet.nodes, { 'nullable': false, 'onDelete': 'CASCADE' })
    public masterJobnet!: MasterJobnet;

    /** ID is the sourece job of this node. */
    // tslint:disable-next-line: typedef
    @ManyToOne(_type => MasterJob, (masterJob: MasterJob) => masterJob.nodeSources, { 'nullable': false, 'onDelete': 'CASCADE' })
    public sourceJob!: MasterJob;

    /** ID is the target job(at SUCCESS) of this node. */
    // tslint:disable-next-line: typedef
    @ManyToOne(_type => MasterJob, (masterJob: MasterJob) => masterJob.nodeTargetSuccesses, { 'nullable': false, 'onDelete': 'CASCADE' })
    public targetSuccessJob!: MasterJob;

    /** ID is the target job(at ERROR) of this node. */
    // tslint:disable-next-line: typedef
    @ManyToOne(_type => MasterJob, (masterJob: MasterJob) => masterJob.nodeTargetErrors, { 'nullable': false, 'onDelete': 'CASCADE' })
    public targetErrorJob!: MasterJob;
}
