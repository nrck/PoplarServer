import { Common } from '../common';
import * as IF from './interface';
import { Job } from './job';

export class Jobnet implements IF.Jobnet {
    [key: string]: Function | string | boolean | IF.Job[] | Date | IF.RunDate | number[][] | NodeJS.Timer | NodeJS.Timer[] | undefined;
    public serial: string;
    public name: string;
    public enable: boolean;
    public info: string;
    public schedule: IF.RunDate;
    public queTime: Date; // 事前処理開始時刻
    public nextMatrix: number[][];
    public errorMatrix: number[][];
    public jobs: Job[];
    public startTime: Date | undefined; // ログ用
    public finishTime: Date | undefined; // ログ用
    public state: string;
    public result: string | undefined;
    public exceptionMes: string | undefined;
    public timer = new Array<NodeJS.Timer>();

    constructor(serial: string, name: string, enable: boolean, info: string, schedule: IF.RunDate, quetime: Date, nextMatrix: number[][], errorMatrix: number[][], jobs: Job[]) {
        this.serial = serial;
        this.name = name;
        this.enable = enable;
        this.info = info;
        this.schedule = schedule;
        this.queTime = quetime;
        this.nextMatrix = nextMatrix;
        this.errorMatrix = errorMatrix;
        this.jobs = jobs;
        this.state = Common.STATE_WAITING_START_TIME;
    }

    public setTimer(value: NodeJS.Timer): void {
        this.timer.push(value);
    }

    public clearTimer(): void {
        this.timer.forEach((value: NodeJS.Timer): void => {
            clearTimeout(value);
        });
        this.timer = new Array<NodeJS.Timer>();
    }

    public getJobIndex(code: string): number {
        return this.jobs.findIndex((job: Job) => job.code === code);
    }

    public isWork(date: Date): boolean {
        // Month
        switch (this.schedule.month.operation) {
            case Common.RUN_MONTH_EVERY:
                break;

            case Common.RUN_MONTH_DESIGNATED:
                if (typeof this.schedule.month.work === 'undefined') {
                    return false;
                }
                if (this.schedule.month.work.indexOf(date.getMonth() + 1) === 0) {
                    return false;
                }
                break;

            default:
                return false;
        }

        // day
        switch (this.schedule.day.operation) {
            case Common.RUN_DAY_DESIGNATED:
                if (typeof this.schedule.day.work === 'undefined') {
                    return false;
                }

                return this.schedule.day.work.indexOf(date.getDate()) >= 0;

            case Common.RUN_DAY_DESIGNATED_WEEKDAY:
                if (typeof this.schedule.day.weekday === 'undefined') {
                    return false;
                }

                return this.schedule.day.weekday.indexOf(date.getDay()) >= 0;

            case Common.RUN_DAY_EVERY:
                return true;

            case Common.RUN_DAY_HOLIDAY:
                // tslint:disable-next-line:no-magic-numbers
                return date.getDay() === 0 || date.getDay() === 6;

            case Common.RUN_DAY_WORKDAY:
                // tslint:disable-next-line:no-magic-numbers
                return date.getDay() !== 0 && date.getDay() !== 6;

            default:
                return false;
        }
    }
}
