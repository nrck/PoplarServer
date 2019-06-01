import { FindConditions, FindManyOptions, FindOneOptions } from 'typeorm';
import { Agent } from './Agent';
import { DataStore } from './DataStore';

export interface IAgent {
    'agent': Agent | undefined;
}

export interface IAgentList {
    'agents': Agent[];
}

export interface IResponseInfo {
    'total': number;
    'timestamp': Date;
    'state': number;
    'message': string;
}

export interface IAgentListResponse extends IAgentList, IResponseInfo { }

export interface IAgentResponse extends IAgent, IResponseInfo { }

declare type TAgentListResolve = (result?: IAgentListResponse | Promise<IAgentListResponse> | undefined) => void;
declare type TAgentListReject = (reason?: IAgentListResponse | Promise<IAgentListResponse> | undefined) => void;

declare type TAgentResolve = (result?: IAgentResponse | Promise<IAgentResponse> | undefined) => void;
declare type TAgentReject = (reason?: IAgentResponse | Promise<IAgentResponse> | undefined) => void;

export interface IPagingParameters {
    offset?: number;
    limit?: number;
}

/**
 * Agent Controller
 */
export class AgentController {
    /** Return ALL AGENT list */
    public static async all(query: IPagingParameters): Promise<IAgentListResponse> {

        return new Promise(async (resolve: TAgentListResolve, reject: TAgentListReject): Promise<void> => {
            const opt: FindManyOptions<Agent> = {
                'skip': query.offset || 0,
                'take': query.limit || 100
            };

            try {
                const conn = await DataStore.createConnection();
                const agents = await conn.manager.find(Agent, opt);

                if (agents.length !== 0) {
                    const res: IAgentListResponse = {
                        'agents': agents,
                        'message': '読み込みに成功しました。',
                        'state': 200,
                        'timestamp': new Date(),
                        'total': agents.length
                    };

                    resolve(res);
                } else {
                    const res: IAgentListResponse = {
                        'agents': agents,
                        'message': 'エージェントがありませんでした。',
                        'state': 404,
                        'timestamp': new Date(),
                        'total': agents.length
                    };

                    reject(res);
                }
            } catch (err) {
                const reason: IAgentListResponse = {
                    'agents': [],
                    'message': err.message,
                    'state': 500,
                    'timestamp': new Date(),
                    'total': 0
                };
                reject(reason);
            }
        });
    }

    /** Get an Agent by id */
    public static async get(id: number): Promise<IAgentResponse> {
        return new Promise(async (resolve: TAgentResolve, reject: TAgentReject): Promise<void> => {
            try {
                const conn = await DataStore.createConnection();
                // ID指定で1件だけ取得
                const result = await conn.manager.findOne<Agent>(Agent, id);

                if (typeof result !== 'undefined') {
                    const res: IAgentResponse = {
                        'agent': result,
                        'message': '読み込みに成功しました。',
                        'state': 200,
                        'timestamp': new Date(),
                        'total': 1
                    };

                    resolve(res);
                } else {
                    const res: IAgentResponse = {
                        'agent': undefined,
                        'message': 'エージェントがありませんでした。',
                        'state': 404,
                        'timestamp': new Date(),
                        'total': 0
                    };

                    reject(res);
                }
            } catch (err) {
                const reason: IAgentResponse = {
                    'agent': undefined,
                    'message': err.message,
                    'state': 500,
                    'timestamp': new Date(),
                    'total': 0
                };

                reject(reason);
            }
        });
    }

    /** Insert an Agent */
    public static async add(param: IAgent): Promise<IAgentResponse> {
        return new Promise(async (resolve: TAgentResolve, reject: TAgentReject): Promise<void> => {
            if (typeof param.agent === 'undefined') {
                reject({
                    'agent': undefined,
                    'message': 'エージェントを指定してください。',
                    'state': 400,
                    'timestamp': new Date(),
                    'total': 0
                });

                return;
            }
            const agent = param.agent;

            try {
                const conn = await DataStore.createConnection();
                await conn.manager.insert(Agent, agent);

                const res: IAgentResponse = {
                    'agent': agent,
                    'message': '書き込みに成功しました。',
                    'state': 200,
                    'timestamp': new Date(),
                    'total': 1
                };

                resolve(res);
            } catch (err) {
                const reason: IAgentResponse = {
                    'agent': agent,
                    'message': err.message,
                    'state': 500,
                    'timestamp': new Date(),
                    'total': 0
                };

                reject(reason);
            }
        });
    }

    /** Update an agent */
    public static async update(param: IAgent): Promise<IAgentResponse> {
        return new Promise(async (resolve: TAgentResolve, reject: TAgentReject): Promise<void> => {
            if (param.agent === undefined) return;

            const opt: FindConditions<Agent> = {
                'ipaddress': param.agent.ipaddress,
                'name': param.agent.name
            };

            try {
                const conn = await DataStore.createConnection();
                const res = await conn.getRepository(Agent).findOne(opt);

                if (res === undefined) {
                    reject({
                        'agent': param.agent,
                        'message': '指定されたエージェントは存在しませんでした。',
                        'state': 404,
                        'timestamp': new Date(),
                        'total': 0
                    });

                    return;
                }

                res.sharekey = param.agent.sharekey;
                const agent = await conn.manager.save(res);

                resolve({
                    'agent': agent,
                    'message': '更新に成功しました。',
                    'state': 200,
                    'timestamp': new Date(),
                    'total': 1
                });

            } catch (err) {
                const reason: IAgentResponse = {
                    'agent': param.agent,
                    'message': err.message,
                    'state': 500,
                    'timestamp': new Date(),
                    'total': 0
                };

                reject(reason);
            }
        });
    }

    // DELETE /tasks/{id}
    // 指定したIDのタスクを削除する
    public static delete(id: number): Promise<ITaskOne> {
        return new Promise(async (resolve, reject) => {
            let result: Agent;

            try {
                const conn = await Store.createConnection();
                const repository = await conn.getRepository(Agent);
                // ID指定で1件だけ取得
                result = await repository.findOneById(id);

                if (!result) {
                    reject({
                        'code': 404,
                        'message': '指定IDのタスクが見つかりませんでした'
                    });
                }

                // データを削除する
                result = await repository.remove(result);

            } catch (err) {
                reject({ 'code': 500, 'message': err.message });

            }

            resolve({ 'task': result });
        });
    }
}
