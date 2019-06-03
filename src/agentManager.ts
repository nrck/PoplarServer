import * as fs from 'fs';
import { Agent } from './Models/Agent';
import { Common } from './common';
import { AgentJSON } from './Models/interface';
import { PoplarException } from './poplarException';


export class AgentManager {
    agents = new Array<Agent>();
    agentFilepath: string;
    agentFile: AgentJSON[] | undefined;

    constructor(filepath: string) {
        this.agentFilepath = filepath;
        this.agents = this.initAgents();
    }

    /**
     * エージェント情報を設定ファイルから読み込みエージェントオブジェクトを作成する
     */
    public initAgents(): Agent[] {
        const agents = new Array<Agent>();

        try {
            this.agentFile = JSON.parse(fs.readFileSync(this.agentFilepath, 'utf8')) as AgentJSON[];
            Common.trace(Common.STATE_INFO, `${this.agentFilepath}を読み込みました。`);
            Common.trace(Common.STATE_DEBUG, JSON.stringify(this.agentFile));
        } catch (error) {
            throw new PoplarException(error);
        }

        for (const agent of this.agentFile) {
            if (this.isExistAgent(agent.name)) {
                throw new PoplarException(`エージェント名称(${agent.name})が重複しています。エージェント設定を確認してください。`);
            }
            agents.push(new Agent(agent.name, agent.ipaddress, agent.sharekey));
            Common.trace(Common.STATE_INFO, `エージェント：${agent.name}を作成しました。`);
        }

        return agents;
    }

    /**
     * 共有キーが一致するか確認します。
     * @param name 確認したいエージェント名
     * @param sharekey 共有キー
     */
    public checkShareKey(name: string, sharekey: string): boolean {
        const agent = this.findAgent(name);
        if (typeof agent === 'undefined') {
            Common.trace(Common.STATE_INFO, `エージェント：${name}が存在しません。`);

            return false;
        }
        Common.trace(Common.STATE_INFO, `エージェント：${name}の共有キー${sharekey}を確認しました。RC=${agent.sharekey === sharekey}`);

        return agent.sharekey === sharekey;
    }

    /**
     * 接続してきたエージェントのIPアドレスを確認します。
     * @param name 確認したいエージェント名
     * @param ipaddress IPアドレス
     */
    public checkIPaddress(name: string, ipaddress: string): boolean {
        const agent = this.findAgent(name);
        Common.trace(Common.STATE_INFO, `エージェント：${name}のIPアドレス${ipaddress}を確認しました。`);
        Common.trace(Common.STATE_DEBUG, `${agent}`);
        if (typeof agent === 'undefined') return false;

        return agent.ipaddress === ipaddress;
    }

    /**
     * エージェントが存在するか確認します。
     * @param name 確認するエージェント名
     */
    public isExistAgent(name: string): boolean {
        return this.agents.findIndex((agent: Agent): boolean => agent.name === name) >= 0;
    }

    /**
     * エージェントが存在するか確認します。
     * @param name 確認するエージェント名
     */
    public isExistSocket(name: string): boolean {
        const agent = this.findAgent(name);
        if (typeof agent === 'undefined') return false;

        return typeof agent.socket !== 'undefined';
    }

    /**
     * エージェントを検索し、エージェントオブジェクトを返します。
     * @param name エージェント名
     */
    public findAgent(name: string): Agent | undefined {
        return this.agents.find((agent: Agent) => agent.name === name);
    }

    /**
     * 指定したエージェントにソケットを設定します。
     * @param name エージェント名
     * @param socket SocketIO.Socketオブジェクト
     */
    public setSocket(name: string, socket: SocketIO.Socket): void {
        const agent = this.findAgent(name);
        if (typeof agent === 'undefined') throw new PoplarException(`${name}はエージェントリストには存在しません。設定を確認してください。`);
        agent.socket = socket;
        Common.trace(Common.STATE_INFO, `エージェント：${name}にsocket(id:${agent.socket.id})を設定しました。`);
    }

    /**
     * 指定したエージェントのソケットを取得します。
     * @param name エージェント名
     */
    public getSocket(name: string): SocketIO.Socket {
        const agent = this.findAgent(name);
        if (typeof agent === 'undefined') throw new PoplarException(`${name}はエージェントリストには存在しません。設定を確認してください。`);
        if (typeof agent.socket === 'undefined') throw new PoplarException(`${name}は未接続です。`);

        return agent.socket;
    }

    /**
     * ソケットを削除します。
     * @param value 削除したいソケット、またはエージェント名
     */
    public delSocket(value: SocketIO.Socket | string): void {
        let agent: Agent | undefined;
        if (typeof value === 'string') {
            agent = this.findAgent(value);
        } else {
            agent = this.agents.find((a: Agent): boolean => {
                if (typeof a.socket === 'undefined') return false;

                return a.socket.id === value.id;
            });
        }
        if (typeof agent === 'undefined') throw new PoplarException('指定されたエージェントが存在しないため、ソケットを削除できませんでした。');
        agent.socket = undefined;
    }
}
