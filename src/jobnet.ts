import { Common } from './common';
import { RunDate } from './interface';
import { Job } from './job';

export class Jobnet {
    private _serial: string;
    private _name: string;
    private _enable: boolean;
    private _info: string;
    private _schedule: RunDate;
    private _queTime: Date; // 事前処理開始時刻
    private _nextMatrix: number[][];
    private _errorMatrix: number[][];
    private _jobs: Job[];
    private _startTime: Date | undefined; // ログ用
    private _finishTime: Date | undefined; // ログ用
    private _state: string;
    private _result: string | undefined;
    private _exceptionMes: string | undefined;
    private _timer = new Array<NodeJS.Timer>();

    constructor(serial: string, name: string, enable: boolean, info: string, schedule: RunDate, quetime: Date, nextMatrix: number[][], errorMatrix: number[][], jobs: Job[]) {
        this._serial = serial;
        this._name = name;
        this._enable = enable;
        this._info = info;
        this._schedule = schedule;
        this._queTime = quetime;
        this._nextMatrix = nextMatrix;
        this._errorMatrix = errorMatrix;
        this._jobs = jobs;
        this._state = Common.STATE_WAITING_START_TIME;
    }

    public get serial(): string {
        return this._serial;
    }

    public set serial(value: string) {
        this._serial = value;
    }

    public get name(): string {
        return this._name;
    }

    public set name(value: string) {
        this._name = value;
    }

    public get enable(): boolean {
        return this._enable;
    }

    public set enable(value: boolean) {
        this._enable = value;
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

    public get queTime(): Date {
        return this._queTime;
    }

    public set queTime(value: Date) {
        this._queTime = value;
    }

    public get nextMatrix(): number[][] {
        return this._nextMatrix;
    }

    public set nextMatrix(value: number[][]) {
        this._nextMatrix = value;
    }

    public get errorMatrix(): number[][] {
        return this._errorMatrix;
    }

    public set errorMatrix(value: number[][]) {
        this._errorMatrix = value;
    }

    public get jobs(): Job[] {
        return this._jobs;
    }

    public set jobs(value: Job[]) {
        this._jobs = value;
    }

    public get state(): string {
        return this._state;
    }

    public set state(value: string) {
        this._state = value;
    }

    public get result(): string | undefined {
        return this._result;
    }

    public set result(value: string | undefined) {
        this._result = value;
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

    public get timer(): NodeJS.Timer[] {
        return this._timer;
    }

    public setTimer(value: NodeJS.Timer): void {
        this._timer.push(value);
    }

    public clearTimer(): void {
        this._timer.forEach((value: NodeJS.Timer): void => {
            clearTimeout(value);
        });
        this._timer = new Array<NodeJS.Timer>();
    }

    public getJobIndex(code: string): number {
        return this.jobs.findIndex((job: Job) => job.code === code);
    }

}
