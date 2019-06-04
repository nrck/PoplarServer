import { FindConditions, FindManyOptions } from 'typeorm';
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

    private static getAgentListResponse(agents: Agent[], message: string = '成功しました。', state: number = 200): IAgentListResponse {
        return {
            'agents': agents,
            'message': message,
            'state': state,
            'timestamp': new Date(),
            'total': agents.length
        };
    }

    private static getAgentResponse(agent: Agent | undefined, message: string = '成功しました。', state: number = 200): IAgentResponse {
        return {
            'agent': agent,
            'message': message,
            'state': state,
            'timestamp': new Date(),
            'total': agent === undefined ? 0 : 1
        };
    }

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
                    resolve(AgentController.getAgentListResponse(agents, '読込に成功しました。'));
                } else {
                    reject(AgentController.getAgentListResponse(agents, 'エージェントがありませんでした。', 404));
                }
            } catch (err) {
                reject(AgentController.getAgentListResponse([], err.message, 500));
            }
        });
    }

    /** Get an Agent by id */
    public static async get(id: number): Promise<IAgentResponse> {
        return new Promise(async (resolve: TAgentResolve, reject: TAgentReject): Promise<void> => {
            try {
                const conn = await DataStore.createConnection();
                const result = await conn.manager.findOne<Agent>(Agent, id);

                if (typeof result !== 'undefined') {
                    resolve(AgentController.getAgentResponse(result, '読込に成功しました。'));
                } else {
                    reject(AgentController.getAgentResponse(result, 'エージェントがありませんでした。', 404));
                }
            } catch (err) {
                reject(AgentController.getAgentResponse(undefined, err.message, 500));
            }
        });
    }

    /** Insert an Agent */
    public static async add(param: IAgent): Promise<IAgentResponse> {
        return new Promise(async (resolve: TAgentResolve, reject: TAgentReject): Promise<void> => {
            if (param.agent === undefined) {
                reject(AgentController.getAgentResponse(undefined, 'エージェントを指定してください。', 400));

                return;
            }

            try {
                const conn = await DataStore.createConnection();
                await conn.manager.insert(Agent, param.agent);
                resolve(AgentController.getAgentResponse(param.agent, '書き込みに成功しました。'));
            } catch (err) {
                reject(AgentController.getAgentResponse(param.agent, err.message, 500));
            }
        });
    }

    /** Update an agent */
    public static async update(param: IAgent): Promise<IAgentResponse> {
        return new Promise(async (resolve: TAgentResolve, reject: TAgentReject): Promise<void> => {
            if (param.agent === undefined) {
                reject(AgentController.getAgentResponse(undefined, 'エージェントを指定してください。', 400));

                return;
            }

            const opt: FindConditions<Agent> = {
                'ipaddress': param.agent.ipaddress,
                'name': param.agent.name
            };

            try {
                const conn = await DataStore.createConnection();
                const res = await conn.getRepository(Agent).findOne(opt);

                if (res === undefined) {
                    reject(AgentController.getAgentResponse(param.agent, '指定されたエージェントは存在しませんでした。', 404));

                    return;
                }

                res.sharekey = param.agent.sharekey;
                const agent = await conn.manager.save(res);

                resolve(AgentController.getAgentResponse(agent, '更新に成功しました。'));

            } catch (err) {
                reject(AgentController.getAgentResponse(param.agent, err.message, 500));
            }
        });
    }

    /** Delete an agent by ID */
    public static async delete(id: number): Promise<IAgentResponse> {
        return new Promise(async (resolve: TAgentResolve, reject: TAgentReject): Promise<void> => {
            try {
                const conn = await DataStore.createConnection();
                const rep = conn.getRepository(Agent);
                const agent = await rep.findOne(id);

                if (agent === undefined) {
                    reject(AgentController.getAgentResponse(agent, 'エージェントがありませんでした。', 404));

                    return;
                }

                await rep.remove(agent);
                resolve(AgentController.getAgentResponse(agent, '削除に成功しました'));
            } catch (err) {
                reject(AgentController.getAgentResponse(undefined, err.message, 500));

            }
        });
    }
}
