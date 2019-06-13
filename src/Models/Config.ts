import { readFileSync } from "fs";

export interface IConfig {
    /** If it is true, Jobnets are scheduled automatically. */
    isAutoSchedule: boolean;
}

export function loadConfig(): IConfig {
    return load(process.env.SERVER_CONFIG_PATH);
}

export function load<T>(filepath: string): T {
    
    return JSON.parse(readFileSync(filepath, 'utf-8')) as T;
}
