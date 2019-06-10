import { BaseEntity, Column, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';

export interface IJobnetNode {
    /** ID of the jobnet that contains this node. */
    jobnetId: number;
    /** ID is the sourece job of this node. */
    sourceJobId: number;
    /** ID is the target job(at SUCCESS) of this node. */
    targetSuccessJobId: number;
    /** ID is the target job(at ERROR) of this node. */
    targetErrorJobId: number;
}

/**
 * Jobnet Node
 */
@Entity()
@Unique('UQ_JOBNET_NODE', ['jobnetId', 'sourceJobId', 'targetSuccessJobId'])
export class JobnetNode extends BaseEntity implements IJobnetNode {
    /** This column is Primary key */
    @PrimaryGeneratedColumn()
    public readonly id!: number;

    /** ID of the jobnet that contains this node. */
    @Column('int', { 'nullable': false })
    public jobnetId!: number;

    /** ID is the sourece job of this node. */
    @Column('int', { 'nullable': false })
    public sourceJobId!: number;

    /** ID is the target job(at SUCCESS) of this node. */
    @Column('int', { 'nullable': false })
    public targetSuccessJobId!: number;

    /** ID is the target job(at ERROR) of this node. */
    @Column('int', { 'nullable': false })
    public targetErrorJobId!: number;
}
