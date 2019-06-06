import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { RunDate } from './interface';

export interface IMasterJobnet {
    /** ジョブネット名 */
    name: string;
    /** 有効無効 */
    enable: boolean; // 定義ファイルには必要だけど、オブジェクトにはいるか？
    /** 説明文 */
    info: string;
    /** 実行スケジュール */
    schedule: RunDate;
    /** 実行順序定義行列 */
    nextMatrix: number[][];
    /** エラー時実行順序定義行列 */
    errorMatrix: number[][];
    /** 実行ジョブ */
    jobs: JobJSON[];
}

@Entity()
export class MasterJobnet extends BaseEntity implements IMasterJobnet {
    @PrimaryGeneratedColumn()
    public readonly id!: number;

    @Column('text')
    public name: string;

    @Column('text')
    public enable: boolean;

    @Column('text')
    public info: string;

    @Column('text')
    public schedule: RunDate;
}
