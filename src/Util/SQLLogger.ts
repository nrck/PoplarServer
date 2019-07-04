import { Logger, QueryRunner } from 'typeorm';
import * as log from './Log';

export class SQLLoger implements Logger {

    logQuery(query: string, parameters?: any[] | undefined, _queryRunner?: QueryRunner | undefined): void {
        log.trace('[SQL LOGGER]Query:  %s', query);
        if (parameters !== undefined) log.trace('[SQL LOGGER]Parm:   %s', JSON.stringify(parameters));
    }

    logQueryError(error: string, query: string, parameters?: any[] | undefined, queryRunner?: QueryRunner | undefined) {
        log.error('[SQL LOGGER]%s', error);
        log.error('[SQL LOGGER]Query:  %s', query);
        if (parameters !== undefined) log.error('[SQL LOGGER]Parm:   %s', JSON.stringify(parameters));
        if (queryRunner !== undefined) log.error('[SQL LOGGER]Runner: %s', queryRunner);
    }

    logQuerySlow(time: number, query: string, parameters?: any[] | undefined, queryRunner?: QueryRunner | undefined) {
        log.warn('[SQL LOGGER]This query is slow. time: %d', time);
        log.warn('[SQL LOGGER]Query:  %s', query);
        if (parameters !== undefined) log.warn('[SQL LOGGER]Parm:   %s', JSON.stringify(parameters));
        if (queryRunner !== undefined) log.warn('[SQL LOGGER]Runner: %s', queryRunner);
    }

    logSchemaBuild(message: string, _queryRunner?: QueryRunner | undefined) {
        log.info('[SQL LOGGER]Schema was builded: %s', message);
    }

    logMigration(message: string, _queryRunner?: QueryRunner | undefined) {
        log.info('[SQL LOGGER]Migrationning: %s', message);
    }

    log(level: "warn" | "info" | "log", message: any, queryRunner?: QueryRunner | undefined) {
        switch (level) {
            default:
            case 'log':
            case 'info':
                log.info('[SQL LOGGER]%s', message);
                break;
            case 'warn':
                log.warn('[SQL LOGGER]%s', message);
                if (queryRunner !== undefined) log.warn('[SQL LOGGER]Runner: %s', queryRunner);
                break;
        }
    }
}
