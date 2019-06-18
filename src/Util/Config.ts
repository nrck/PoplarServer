import { readFileSync } from 'fs';
import { IConfig } from '../Models/Interface/Config';
import { PoplarException } from '../Models/PoplarException';
import * as log from './Log';

export const CONFIG_PATH_SERVER = './config/server.json';

/**
 * Loading config
 * @throws PoplarException
 */
const load = <T>(filepath: string): T => {
    log.info('%s Loading...', filepath);
    try {
        const stringData = readFileSync(filepath, 'utf-8');

        return JSON.parse(stringData) as T;
    } catch (error) {
        const e = error as Error;
        throw new PoplarException(e.message, e.stack);
    }
};

/**
 * Loading config
 * @throws PoplarException
 */
export const loadConfig = (): IConfig => {
    const path = process.env.SERVER_CONFIG_PATH === undefined ? CONFIG_PATH_SERVER : process.env.SERVER_CONFIG_PATH;
    const data = load<IConfig>(path);
    if (data.isAutoSchedule === undefined) throw new PoplarException(`${path} don't has 'isAutoSchedule' or undefined.`);
    if (data.autoScheduleDays === undefined) throw new PoplarException(`${path} don't has 'autoScheduleDays' or undefined.`);
    if (data.autoScheduleIntervalTime === undefined) throw new PoplarException(`${path} don't has 'autoScheduleIntervalTime' or undefined.`);
    if (data.logDirPath === undefined) throw new PoplarException(`${path} don't has 'logDirPath' or undefined.`);
    if (data.queueWaitingTime === undefined) throw new PoplarException(`${path} don't has 'queueWaitingTime' or undefined.`);

    return data;
};
