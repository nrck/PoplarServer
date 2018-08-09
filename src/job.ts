import { Common } from './common';
import * as IF from './interface';

export class Job implements IF.Job {
    private _isSpecial = false;
    private _cwd?: string;
    private _code: string;
    private _agentName: string;
    private _info: string;
    private _schedule: IF.RunDate;
    private _file?: string;
    private _args?: string[];
    private _state: string;
    private _returnCode: string | undefined;
    private _exceptionMes: string | undefined;
    private _startTime: Date | undefined; // ログ用
    private _finishTime: Date | undefined; // ログ用

    /**
     * ジョブを作成します。
     * @param code ジョブ固有のコードです。
     * @param agentName 実行対象のエージェント名です。
     * @param info ジョブの説明文です。
     * @param schedule ジョブ実行スケジュールです。
     * @param options オプションです。trueだと特殊ジョブになります。string型だとファイル名のみの設定です。
     */
    constructor(code: string, agentName: string, info: string, schedule: IF.RunDate, options: true | string | { file?: string; args?: string[]; cwd?: string }) {
        this._code = code;
        this._agentName = agentName;
        this._info = info;
        this._schedule = schedule;
        if (typeof options === 'string') {
            this._file = options;
        } else if (typeof options === 'boolean') {
            this._isSpecial = true;
        } else {
            this._file = options.file;
            this._cwd = options.cwd;
            this._args = options.args;
        }
        this._state = Common.STATE_WAITING_START_TIME;
        Common.trace(Common.STATE_DEBUG, `Job object was created. code:${code}, agentName:${agentName}`);
    }

    public get code(): string {
        return this._code;
    }

    public set code(value: string) {
        this._code = value;
    }

    public get agentName(): string {
        return this._agentName;
    }

    public set agentName(value: string) {
        this._agentName = value;
    }

    public get info(): string {
        return this._info;
    }

    public set info(value: string) {
        this._info = value;
    }

    public get schedule(): IF.RunDate {
        return this._schedule;
    }

    public set schedule(value: IF.RunDate) {
        this._schedule = value;
    }

    public get file(): string | undefined {
        return this._file;
    }

    public set file(value: string | undefined) {
        this._file = value;
    }

    public get args(): string[] | undefined {
        return this._args;
    }

    public set args(value: string[] | undefined) {
        this._args = value;
    }

    public get state(): string {
        return this._state;
    }

    public set state(value: string) {
        this._state = value;
    }

    public get returnCode(): string | undefined {
        return this._returnCode;
    }

    public set returnCode(value: string | undefined) {
        this._returnCode = value;
    }

    public get exceptionMes(): string | undefined {
        return this._exceptionMes;
    }

    public set exceptionMes(value: string | undefined) {
        this._exceptionMes = value;
    }

    public get startTime(): Date | undefined {
        return this._startTime;
    }

    public set startTime(value: Date | undefined) {
        this._startTime = value;
    }

    public get finishTime(): Date | undefined {
        return this._finishTime;
    }

    public set finishTime(value: Date | undefined) {
        this._finishTime = value;
    }

    public get isSpecial(): boolean {
        return this._isSpecial;
    }

    public set isSpecial(value: boolean) {
        this._isSpecial = value;
    }

    public get cwd(): string | undefined {
        return this._cwd;
    }

    public set cwd(value: string | undefined) {
        this._cwd = value;
    }


}
