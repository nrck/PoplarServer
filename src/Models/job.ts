import { BaseEntity, Column, Entity, Generated, Index, PrimaryColumn, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { RunDate } from './interface';
import { Common } from '../common';

export interface IJobOption {
    file?: string;
    args?: string[];
    cwd?: string
}

export interface IJob {
    /** ジョブの状態 */
    state: string;
    /** リターンコード */
    returnCode?: string;
    /** エラーメッセージ */
    exceptionMes?: string;
    /** 実開始時刻 */
    startTime?: Date;
    /** 実終了時刻 */
    finishTime?: Date;
    /** 実行対象のエージェントネーム */
    agentName: string;
    /** ジョブの説明文 */
    info: string;
    /** ジョブの実行スケジュール */
    _schedule: RunDate;
    /** ユニークジョブ？ */
    isSpecial: boolean;
    /** 実行対象のファイル */
    file?: string;
    /** 実行するディレクトリ */
    cwd?: string;
    /** 実行時の引数 */
    args?: string[];
}

@Entity()
export class Job extends BaseEntity implements IJob {
    @PrimaryGeneratedColumn()
    public readonly id!: number;

    @Column('boolean', { 'nullable': false })
    public isSpecial = false;

    @Column('text')
    public cwd?: string;

    @Column('text')
    public agentName: string;

    @Column('text')
    public info: string;


    @Column('text')
    private schedule: string;

    public get schedule(): RunDate {
        return JSON.parse(this._schedule) as RunDate;
    }

    public set schedule(schedule: RunDate) {
        this._schedule = JSON.stringify(schedule);
    }

    public file?: string;
    public args?: string[];
    public state: string;
    public returnCode: string | undefined;
    public exceptionMes: string | undefined;
    public startTime: Date | undefined; // ログ用
    public finishTime: Date | undefined; // ログ用

    /**
     * ジョブを作成します。
     * @param agentName 実行対象のエージェント名です。
     * @param info ジョブの説明文です。
     * @param schedule ジョブ実行スケジュールです。
     * @param options オプションです。trueだと特殊ジョブになります。string型だとファイル名のみの設定です。
     */
    constructor(agentName: string, info: string, schedule: RunDate, options: true | string | IJobOption) {
        super();
        this.agentName = agentName;
        this.info = info;
        this._schedule = '';
        this.schedule = schedule;
        if (typeof options === 'string') {
            this.file = options;
        } else if (typeof options === 'boolean') {
            this.isSpecial = true;
        } else {
            this.file = options.file;
            this.cwd = options.cwd;
            this.args = options.args;
        }
        this.state = Common.STATE_WAITING_START_TIME;
    }
}