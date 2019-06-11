import { BaseEntity, Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { RunDate } from './interface';
import { JobnetNode } from './JobnetNode';

export interface IMasterJobnet {
    /** ジョブネット名 */
    name: string;
    /** 有効無効 */
    enable: boolean;
    /** 説明文 */
    info: string;
    /** 実行スケジュール */
    schedule: RunDate;
}

/**
 * Master Jobnet class. This class extend BaseEntity.
 */
@Entity()
export class MasterJobnet extends BaseEntity implements IMasterJobnet {
    /** Master Jobnet ID. This is primary key */
    @PrimaryGeneratedColumn()
    public readonly id!: number;

    /** This jobnets name */
    @Column('text', { 'nullable': false })
    public name!: string;

    /** Enable is true */
    @Column('boolean', { 'nullable': false, 'default': false })
    public enable!: boolean;

    /** Jobnet describe */
    @Column('text')
    public info = '';

    /** Execute schedule */
    @Column('simple-json', { 'name': 'schedule', 'nullable': false })
    public schedule!: RunDate;

    /** Node ID */
    // tslint:disable-next-line: typedef
    @OneToMany(_type => JobnetNode, jobnetNode => jobnetNode.id, { 'onDelete': 'SET NULL' })
    public nodes!: JobnetNode[];
}
