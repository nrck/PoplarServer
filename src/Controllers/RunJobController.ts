import { RunJob } from '../Models/RunJob';
import { NOT_FOUND } from '../Models/Types/HttpStateCode';
import { BaseController, IResponse } from './BaseController';

/**
 * Run Job Controller
 */
export class RunJobController extends BaseController {
    /**
     * Runjobnet save
     * @param runjobnet save object
     */
    public static async save(runjob: RunJob): Promise<IResponse<RunJob>> {
        try {
            const res = await super.update(RunJob, runjob, { 'id': runjob.id });

            return res;
        } catch (error) {
            const res = error as IResponse<RunJob>;
            if (res.state === NOT_FOUND) {
                return await super.add(RunJob, runjob);
            } else {
                throw error;
            }
        }
    }
}
