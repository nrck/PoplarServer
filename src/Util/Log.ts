import * as Moment from 'moment';
import * as path from 'path';
import * as util from 'util';
import { PoplarException } from '../Models/PoplarException';

export enum LogLevel {
    TRACE = -1,
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3
}

export let logLevel: LogLevel = LogLevel.TRACE;

// colorモジュールに置き換えるかも
// TODO: replace color module
const red = '\u001b[31m';
const yellow = '\u001b[33m';
const reset = '\u001b[0m';

/**
 * outputlog
 * @param level Output message log level.
 * @param log Output message
 */
const outputLog = (level: LogLevel, log: string): void => {
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
};

/**
 * Output log message formatter
 * @param level Output message log level
 * @param args util.format() arguments
 */
// tslint:disable-next-line: no-any
const formatLogString = (level: LogLevel, args: any[]): string => {
    const nowStr = Moment().format();
    // tslint:disable-next-line: no-magic-numbers
    const levelStr = (`${LogLevel[level]}     `).slice(0, 5);
    // tslint:disable-next-line: no-any
    const logStr = util.format.apply<undefined, any[], string>(undefined, args);
    const e = new Error();
    // tslint:disable-next-line: no-magic-numbers
    const frames = (e.stack as string).split('\n');
    const frame = frames[3].split(' ')[5] === 'new' ? frames[4] : frames[3];
    const at = frame.split(':');
    // tslint:disable-next-line: no-magic-numbers
    const lineNumber = at[at.length - 2];
    const filename = frame.split(process.cwd())[1].split(':')[0];
    // tslint:disable-next-line: no-magic-numbers
    const functionName = frame.split(' ')[5];

    return util.format('%s [%s] %s (%s:%s %s)', nowStr, levelStr, logStr, path.basename(filename), lineNumber, functionName);
};

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
    if (util.types.isNativeError(msg[0]) || msg[0] instanceof PoplarException) {
        const message = (msg[0] as Error).message;
        outputLog(LogLevel.ERROR, formatLogString(LogLevel.ERROR, [message]));
        if ((msg[0] as Error).stack !== undefined) {
            debug((msg[0] as Error).stack);
        }
    } else {
        outputLog(LogLevel.ERROR, formatLogString(LogLevel.ERROR, msg));
    }
}
