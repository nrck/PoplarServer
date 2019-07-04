import { ObjectType } from 'typeorm';
import { BaseController, FuncReject, FuncResolve, IResponse } from '../Models/BaseController';
import { DataStore } from '../Models/DataStore';
import { JobnetNode } from '../Models/JobnetNode';
import { MasterJobnet } from '../Models/MasterJobnet';
import { NOT_FOUND, SERVER_ERROR } from '../Models/Types/HttpStateCode';
import * as log from '../Util/Log';

/**
 * Master Job Controller
 */
export class MasterJobnetController extends BaseController {
    public static async get(entityClass: ObjectType<MasterJobnet>, id: number): Promise<IResponse<MasterJobnet>>;
    public static async get(id: number): Promise<IResponse<MasterJobnet>>;

    public static async get(entityClassOrId: ObjectType<MasterJobnet> | number, id?: number): Promise<IResponse<MasterJobnet>> {
        if (typeof entityClassOrId !== 'number') {
            return super.get<MasterJobnet>(MasterJobnet, id as number);
        }

        // tslint:disable-next-line: space-before-function-paren
        return new Promise(async (resolve: FuncResolve<MasterJobnet>, reject: FuncReject<MasterJobnet>): Promise<void> => {
            try {
                const conn = await DataStore.createConnection();
                const repository = conn.getRepository(MasterJobnet);
                const object = await repository.findOne(entityClassOrId);

                if (object === undefined) {
                    reject(super.getResponse<MasterJobnet>(object, 'MasterJobnet is not found.', NOT_FOUND));
                } else {
                    object.nodes = await conn.getRepository(JobnetNode)
                        .createQueryBuilder('node')
                        .where('node.masterJobnet = :mid', { 'mid': entityClassOrId })
                        .leftJoinAndSelect('node.sourceJob', 'sourceJob')
                        .leftJoinAndSelect('node.targetSuccessJob', 'targetSuccessJob')
                        .leftJoinAndSelect('node.targetErrorJob', 'targetErrorJob')
                        .getMany();
                    resolve(BaseController.getResponse<MasterJobnet>(object));
                }
            } catch (err) {
                log.error(err);
                reject(BaseController.getResponse<MasterJobnet>(undefined, (err as Error).message, SERVER_ERROR));
            }
        });
    }
}
