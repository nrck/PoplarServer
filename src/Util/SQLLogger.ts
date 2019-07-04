import { Logger, QueryRunner } from 'typeorm';
import * as log from './Log';

export class SQLLoger implements Logger {

    logQuery(query: string, parameters?: any[] | undefined, queryRunner?: QueryRunner | undefined): void {
        log.trace('Query:  %s', query);
        if (parameters !== undefined) log.trace('Parm:   %s', JSON.stringify(parameters));
    }

    logQueryError(error: string, query: string, parameters?: any[] | undefined, queryRunner?: QueryRunner | undefined) {
        log.error(error);
        log.error('Query:  %s', query);
        if (parameters !== undefined) log.error('Parm:   %s', JSON.stringify(parameters));
        if (queryRunner !== undefined) log.error('Runner: %s', queryRunner);
    }

    logQuerySlow(time: number, query: string, parameters?: any[] | undefined, queryRunner?: QueryRunner | undefined) {
        log.warn('This query is slow. time: %d', time);
        log.warn('Query:  %s', query);
        if (parameters !== undefined) log.warn('Parm:   %s', JSON.stringify(parameters));
        if (queryRunner !== undefined) log.warn('Runner: %s', queryRunner);
    }

    logSchemaBuild(message: string, queryRunner?: QueryRunner | undefined) {
        log.info('Schema was builded: %s', message);
    }

    logMigration(message: string, queryRunner?: QueryRunner | undefined) {
        log.info('Migrationning: %s', message);
    }

    log(level: "warn" | "info" | "log", message: any, queryRunner?: QueryRunner | undefined) {
        switch (level) {
            default:
            case 'log':
            case 'info':
                log.info(message);
                break;
            case 'warn':
                log.warn(message);
                if (queryRunner !== undefined) log.warn('Runner: %s', queryRunner);
                break;
        }
    }
}
