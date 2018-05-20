import { Common } from './common';
import { RunDate } from './interface';

export class Job {
    private _code: string;
    private _agentName: string;
    private _info: string;
    private _schedule: RunDate;
    private _file: string;
    private _args: string[] | undefined;
    private _state: string;
    private _returnCode: string | undefined;
    private _exceptionMes: string | undefined;
    private _startTime: Date | undefined; // ログ用
    private _finishTime: Date | undefined; // ログ用

    constructor(code: string, agentName: string, info: string, schedule: RunDate, file: string, args?: string[]) {
        this._code = code;
        this._agentName = agentName;
        this._info = info;
        this._schedule = schedule;
        this._file = file;
        this._args = args;
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

    public get schedule(): RunDate {
        return this._schedule;
    }

    public set schedule(value: RunDate) {
        this._schedule = value;
    }

    public get file(): string {
        return this._file;
    }

    public set file(value: string) {
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

}
