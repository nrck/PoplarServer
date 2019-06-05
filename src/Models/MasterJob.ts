import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { RunDate } from './interface';

export interface IMasterJobOption {
    file: string;
    args?: string;
    cwd?: string;
}

export interface IMasterJob {
    /** 実行対象のエージェントネーム */
    agentID: number;
    /** ジョブの説明文 */
    info: string;
    /** ジョブの実行スケジュール */
    schedule: RunDate;
    /** ユニークジョブ？ */
    isControlJob: boolean;
    /** 実行対象のファイル */
    file: string;
    /** 実行するディレクトリ */
    cwd: string;
    /** 実行時の引数 */
    args: string;
}

declare type TMasterJobConstractOptions = true | string | IMasterJobOption;

@Entity()
export class MasterJob extends BaseEntity implements IMasterJob {
    @PrimaryGeneratedColumn()
    public readonly id!: number;

    @Column('boolean', { 'nullable': false })
    public isControlJob = false;

    @Column('text')
    public cwd = './';

    @Column('number', { 'nullable': false })
    public agentID: number;

    @Column('text')
    public info: string;

    @Column('text', { 'name': 'schedule', 'nullable': false })
    private _schedule!: string;

    public get schedule(): RunDate {
        return JSON.parse(this._schedule) as RunDate;
    }

    public set schedule(schedule: RunDate) {
        this._schedule = JSON.stringify(schedule);
    }

    @Column('text')
    public file = '';

    @Column('text')
    public args = '';

    /**
     * ジョブを作成します。
     * @param agentID 実行対象のエージェント名です。
     * @param info ジョブの説明文です。
     * @param schedule ジョブ実行スケジュールです。
     * @param options オプションです。trueだと特殊ジョブになります。string型だとファイル名のみの設定です。
     */
    constructor(agentID: number, info: string, schedule: RunDate, options: TMasterJobConstractOptions) {
        super();
        this.agentID = agentID;
        this.info = info;
        this.schedule = schedule;
        if (typeof options === 'string') {
            this.file = options;
        } else if (typeof options === 'boolean') {
            this.isControlJob = true;
        } else {
            this.file = options.file;
            this.cwd = options.cwd || './';
            this.args = options.args || '';
        }
    }
}
