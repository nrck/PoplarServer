import * as Moment from 'moment';
import { FindConditions, IsNull } from 'typeorm';
import { DataStore } from '../Models/DataStore';
import { RunJobnet } from '../Models/RunJobnet';
import { NOT_FOUND, SERVER_ERROR } from '../Models/Types/HttpStateCode';
import * as log from '../Util/Log';
import { BaseController, FuncReject, FuncResolve, IResponse } from './BaseController';

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
                'finishTime': IsNull()
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

    /**
     * Is there the name of runjobnet in the database?
     * @param name the name of runjobnet
     * @param queueTime queue time
     */
    public static async isExistRunJobnet(name: string, queueTime: Date): Promise<boolean> {
        const opt: FindConditions<RunJobnet> = {
            'name': name
        };

        const conn = await DataStore.createConnection();
        const objects = await conn.getRepository(RunJobnet).find({ 'where': opt });
        const isExist = objects.find((runjobnet: RunJobnet) => Moment(runjobnet.queTime).diff(Moment(queueTime)) === 0);

        return isExist !== undefined;
    }

    /**
     * Runjobnet save
     * @param runjobnet save object
     */
    public static async save(runjobnet: RunJobnet): Promise<IResponse<RunJobnet>> {
        return super.update(RunJobnet, runjobnet, { 'id': runjobnet.id });
    }
}
