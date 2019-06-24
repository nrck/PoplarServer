import { BaseEntity, Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { RunDate } from './Interface/RunDate';
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
    @OneToMany(_type => JobnetNode, jobnetNode => jobnetNode.masterJobnet, { 'onDelete': 'SET NULL' })
    public nodes?: JobnetNode[];

    /** Do this jobnet work at the arguments date. */
    public isWork(date: Date): boolean {
        // Month
        switch (this.schedule.month.operation) {
            case 'EveryMonth':
                break;

            case 'DesignatedMonth':
                if (this.schedule.month.work.indexOf(date.getMonth() + 1) === 0) {
                    return false;
                }
                break;

            default:
                return false;
        }

        // day
        switch (this.schedule.day.operation) {
            case 'DesignatedDay':
                return this.schedule.day.work.indexOf(date.getDate()) >= 0;

            case 'DesignatedWeekday':
                return this.schedule.day.weekday.indexOf(date.getDay()) >= 0;

            case 'EveryDay':
                return true;

            case 'Holiday':
                // tslint:disable-next-line:no-magic-numbers
                return date.getDay() === 0 || date.getDay() === 6;

            case 'Workday':
                // tslint:disable-next-line:no-magic-numbers
                return date.getDay() !== 0 && date.getDay() !== 6;

            default:
                return false;
        }
    }
}
