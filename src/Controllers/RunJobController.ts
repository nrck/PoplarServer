import { RunJob } from '../Models/RunJob';
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
        return super.update(RunJob, runjob, { 'id': runjob.id });
    }
}
