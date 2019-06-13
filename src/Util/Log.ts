import * as Moment from 'moment';
import * as util from 'util';

export enum LogLevel {
    TRACE = -1,
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3
}

export let logLevel: LogLevel = LogLevel.TRACE;

const red = '\u001b[31m';
const yellow = '\u001b[33m';
const reset = '\u001b[0m';

function outputLog(level: LogLevel, log: string): void {
    if (level < logLevel) {
        return;
    }

    switch (level) {
        case LogLevel.TRACE:
        case LogLevel.DEBUG:
            console.log(log);
            break;
        case LogLevel.INFO:
            console.info(log);
            break;
        case LogLevel.WARN:
            console.warn(yellow + log + reset);
            break;
        case LogLevel.ERROR:
            console.error(red + log + reset);
            break;
        default:
            break;
    }
}

function formatLogString(level: LogLevel, args: any[]): string {
    const nowStr = Moment().format();
    const levelStr = `${LogLevel[level]}     `;
    // tslint:disable-next-line: no-any
    const logStr = util.format.apply<undefined, any[], string>(undefined, args);
    const e = new Error();
    const frame = e.stack!.split('\n')[3];
    const at = frame.split(':');
    const lineNumber = at[at.length - 2];
    const functionName = frame.split(' ')[5];

    return util.format('%s [%s] %s (%s:%s)', nowStr, levelStr.slice(0, 5), logStr, functionName, lineNumber);
}

export function trace(...msg: any[]): void {
    outputLog(LogLevel.TRACE, formatLogString(LogLevel.TRACE, msg));
}

export function debug(...msg: any[]): void {
    outputLog(LogLevel.DEBUG, formatLogString(LogLevel.DEBUG, msg));
}

export function info(...msg: any[]): void {
    outputLog(LogLevel.INFO, formatLogString(LogLevel.INFO, msg));
}

export function warn(...msg: any[]): void {
    outputLog(LogLevel.WARN, formatLogString(LogLevel.WARN, msg));
}

export function error(...msg: any[]): void {
    outputLog(LogLevel.ERROR, formatLogString(LogLevel.ERROR, msg));
}
