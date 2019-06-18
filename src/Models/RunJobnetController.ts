import { FindConditions, MoreThan } from 'typeorm';
import { queueWaitingTime } from '../Scheduler';
import * as log from '../Util/Log';
import { BaseController, FuncReject, FuncResolve, IResponse } from './BaseController';
import { DataStore } from './DataStore';
import { RunJobnet } from './RunJobnet';
import { NOT_FOUND, SERVER_ERROR } from './Types/HttpStateCode';

/**
 * Run Job Controller
 */
export class RunJobnetController extends BaseController {
    /**
     * Get queue from run jobnet
     */
    public static async getQueue(): Promise<IResponse<RunJobnet>> {
        // tslint:disable-next-line: space-before-function-paren
        return new Promise(async (resolve: FuncResolve<RunJobnet>, reject: FuncReject<RunJobnet>): Promise<void> => {
            const opt: FindConditions<RunJobnet> = {
                'queTime': MoreThan(new Date(Date.now() - queueWaitingTime))
            };

            try {
                const conn = await DataStore.createConnection();
                const objects = await conn.getRepository(RunJobnet).find(opt);

                if (objects.length === 0) {
                    reject(super.getResponse<RunJobnet>(objects, 'RunJobnet is not found.', NOT_FOUND));
                } else {
                    resolve(super.getResponse<RunJobnet>(objects));
                }
            } catch (err) {
                log.error(err);
                reject(super.getResponse<RunJobnet>(undefined, (err as Error).message, SERVER_ERROR));
            }
        });
    }
}
