import { readFileSync } from 'fs';
import { PoplarException } from '../Models/PoplarException';
import * as log from './Log';

export interface IConfig {
    /** If it is true, Jobnets are scheduled automatically. */
    isAutoSchedule?: boolean;
}

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
    const path = process.env.SERVER_CONFIG_PATH === undefined ? './config/server.json' : process.env.SERVER_CONFIG_PATH;
    const data = load<IConfig>(path);
    if (data.isAutoSchedule === undefined) throw new PoplarException(`${path} don't has 'isAutoSchedule' or undefined.`);

    return data;
};
