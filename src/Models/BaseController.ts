import { BaseEntity, FindConditions, FindManyOptions, ObjectType } from 'typeorm';
import { DataStore } from './DataStore';
import { IPaging } from './Interface/Parameter';
import { IBaseResponse } from './Interface/Response';

export interface IResponse<T> extends IBaseResponse {
    'entity': T | T[] | undefined;
}

declare type FuncResolve<T> = (result?: IResponse<T> | Promise<IResponse<T>> | undefined) => void;

declare type FuncReject<T> = (reason?: IResponse<T> | Promise<IResponse<T>> | undefined) => void;

/**
 * Generic Controller
 */
export class BaseController {

    /**
     * Create response
     * @param entity response date
     * @param message result message
     * @param state This is HTTP State code. 200 is OK. 500 is error.
     */
    private static getResponse<T>(entity: T | T[] | undefined, message = 'Success.', state = 200): IResponse<T> {
        let total = 0;
        if (Array.isArray(entity)) {
            total = entity.length;
        } else if (entity !== undefined) {
            total = 1;
        }

        return {
            'entity': entity,
            'message': message,
            'state': state,
            'timestamp': new Date(),
            'total': total
        };
    }

    /** Return ALL MASTER JOB list */
    public static async all<T extends BaseEntity>(entityClass: ObjectType<T>, query: IPaging): Promise<IResponse<T>> {
        return new Promise(async(resolve: FuncResolve<T>, reject: FuncReject<T>): Promise<void> => {
            const opt: FindManyOptions<T> = {
                'skip': query.offset || 0,
                'take': query.limit || 100
            };

            try {
                const conn = await DataStore.createConnection();
                const objects = await conn.manager.find<T>(entityClass, opt);

                if (objects.length === 0) {
                    reject(BaseController.getResponse<T>(objects, `${entityClass.name} is not found.`, 404));
                } else {
                    resolve(BaseController.getResponse<T>(objects));
                }
            } catch (err) {
                reject(BaseController.getResponse<T>(undefined, err.message, 500));
            }
        });
    }

    /** Get an master job by id */
    public static async get<T extends BaseEntity>(entityClass: ObjectType<T>, id: number): Promise<IResponse<T>> {
        return new Promise(async(resolve: FuncResolve<T>, reject: FuncReject<T>): Promise<void> => {
            try {
                const conn = await DataStore.createConnection();
                const object = await conn.manager.findOne<T>(entityClass, id);

                if (object === undefined) {
                    reject(BaseController.getResponse<T>(object, `${entityClass.name} is not found.`, 404));
                } else {
                    resolve(BaseController.getResponse<T>(object));
                }
            } catch (err) {
                reject(BaseController.getResponse<T>(undefined, err.message, 500));
            }
        });
    }

    /** Insert an Agent */
    public static async add<T>(entityClass: ObjectType<T>, param: T): Promise<IResponse<T>> {
        return new Promise(async(resolve: FuncResolve<T>, reject: FuncReject<T>): Promise<void> => {
            if (param === undefined) {
                reject(BaseController.getResponse<T>(undefined, `Your ${entityClass.name} parameter is bad request.`, 400));

                return;
            }

            try {
                const conn = await DataStore.createConnection();
                await conn.manager.insert<T>(entityClass, param);
                resolve(BaseController.getResponse<T>(param));
            } catch (err) {
                reject(BaseController.getResponse<T>(param, err.message, 500));
            }
        });
    }

    /** Update an agent */
    public static async update<T extends { id: number }>(entityClass: ObjectType<T>, entity: T, opt: FindConditions<T>): Promise<IResponse<T>> {
        return new Promise(async(resolve: FuncResolve<T>, reject: FuncReject<T>): Promise<void> => {
            try {
                const conn = await DataStore.createConnection();
                const findone = await conn.getRepository(entityClass).findOne(opt);

                if (findone === undefined) {
                    reject(BaseController.getResponse<T>(undefined, `${entityClass.name} is not found.`, 404));

                    return;
                }
                entity.id = findone.id;
                const object = await conn.manager.save(entity);

                resolve(BaseController.getResponse<T>(object));

            } catch (err) {
                reject(BaseController.getResponse<T>(entity, err.message, 500));
            }
        });
    }

    /** Delete an agent by ID */
    public static async delete<T extends BaseEntity>(entityClass: ObjectType<T>, id: number): Promise<IResponse<T>> {
        return new Promise(async(resolve: FuncResolve<T>, reject: FuncReject<T>): Promise<void> => {
            try {
                const conn = await DataStore.createConnection();
                const rep = conn.getRepository(entityClass);
                const object = await rep.findOne(id);

                if (object === undefined) {
                    reject(BaseController.getResponse<T>(object, `${entityClass.name} is not found.`, 404));

                    return;
                }

                await rep.remove(object);
                resolve(BaseController.getResponse<T>(object));
            } catch (err) {
                reject(BaseController.getResponse<T>(undefined, err.message, 500));
            }
        });
    }
}
