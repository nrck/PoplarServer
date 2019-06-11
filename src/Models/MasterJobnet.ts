import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { RunDate } from './interface';

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
    @Column('text')
    public name!: string;

    /** Enable is true */
    @Column('boolean')
    public enable = false;

    /** Jobnet describe */
    @Column('text')
    public info = '';

    /** Execute schedule */
    @Column('simple-json', { 'name': 'schedule', 'nullable': false })
    public schedule!: RunDate;
}
