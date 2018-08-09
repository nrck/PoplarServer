import { Agent } from './agent';
import { AgentManager } from './agentManager';
import { Common } from './common';
import { AgentJSON, AgentState, CollectInfo, JobnetJSON, SerialJobJSON } from './interface';
import { Job } from './job';
import { Jobnet } from './jobnet';
import { Jobscheduler } from './jobscheduler';
import { PoplarException } from './poplarException';
import { ServerManager } from './serverManager';

class App {
    // tslint:disable-next-line:no-magic-numbers
    private svm = new ServerManager(27131, 0);
    private js = new Jobscheduler('./config/jobnet.json', 0);
    private am = new AgentManager('./config/agent.json');

    /**
     * ここから始まるんだ！
     */
    public start(): void {
        try {
            // サーバー初期化
            this.svm.initServer();
            // Hello受信
            this.svm.events.on(Common.EVENT_RECEIVE_HELLO, (socket: SocketIO.Socket, data: AgentJSON, ack: Function) => this.receiveHello(socket, data, ack));
            // 切断イベント受信
            this.svm.events.on(Common.EVENT_DISCONNECT, (socket: SocketIO.Socket, reason: string) => this.disconect(socket, reason));
            // ジョブ実行結果受信
            this.svm.events.on(Common.EVENT_RECEIVE_SCHEDULE_RELOAD, () => this.js.events.emit(Common.EVENT_RECEIVE_SCHEDULE_RELOAD));
            // 情報収集受信
            this.svm.events.on(Common.EVENT_RECEIVE_COLLECT_INFO, (callback: Function) => this.receiveCollectInfo(callback));
            // 定義の追加
            this.svm.events.on(Common.EVENT_RECEIVE_PUT_DEFINE_JOBNET, (newJobnet: JobnetJSON, callback: (err: Error | undefined, data: JobnetJSON[] | undefined) => void) => this.receivePutDefineJobnet(newJobnet, callback));
            // 定義の削除
            this.svm.events.on(Common.EVENT_RECEIVE_REMOVE_DEFINE_JOBNET, (jobnetName: string, callback: (err: Error | undefined, data: JobnetJSON[] | undefined) => void) => this.receiveRemoveDefineJobnet(jobnetName, callback));
            // 定義の更新
            this.svm.events.on(Common.EVENT_RECEIVE_UPDATE_DEFINE_JOBNET, (jobnetName: string, newJobnet: JobnetJSON, callback: (err: Error | undefined, data: JobnetJSON[] | undefined) => void) => this.receiveUpdateDefineJobnet(jobnetName, newJobnet, callback));
            // 実行中の一時停止
            this.svm.events.on(Common.EVENT_RECEIVE_PAUSE_RUNNIG_JOBNET, (serial: string, jobcode: string | undefined, callback: (err: Error | undefined, data: Jobnet | undefined) => void) => this.receivePauseRunningJobnet(serial, jobcode, callback));
            // 実行中の中止
            this.svm.events.on(Common.EVENT_RECEIVE_STOP_RUNNIG_JOBNET, (serial: string, jobcode: string | undefined, callback: (err: Error | undefined, data: Jobnet | undefined) => void) => this.receiveStopRunningJobnet(serial, jobcode, callback));
            // 実行中の通過
            this.svm.events.on(Common.EVENT_RECEIVE_PASS_RUNNIG_JOBNET, (serial: string, jobcode: string | undefined, callback: (err: Error | undefined, data: Jobnet | undefined) => void) => this.receivePassRunningJobnet(serial, jobcode, callback));
            // 再実行
            // this.svm.events.on(Common.EVENT_RECEIVE_RERUN_FINISH_JOBNET, (serial: string, callback: (err: Error | undefined, data: Jobnet | undefined) => void) =>);

            // ジョブ送信
            this.js.events.on(Common.EVENT_SEND_JOB, (jobjson: SerialJobJSON, onAck: Function) => this.sendJob(Common.EVENT_SEND_JOB, jobjson, onAck));
            // ジョブ強制終了送信
            this.js.events.on(Common.EVENT_KILL_JOB, (jobjson: SerialJobJSON, onAck: Function) => this.sendJob(Common.EVENT_KILL_JOB, jobjson, onAck));
        } catch (error) {
            Common.trace(Common.STATE_ERROR, error.stack);
            this.start();
        }
    }

    private receiveHello(socket: SocketIO.Socket, data: AgentJSON, ack: Function): void {
        const isOK = this.am.checkShareKey(data.name, data.sharekey) && !this.am.isExistSocket(data.name);
        if (isOK) this.am.setSocket(data.name, socket);
        ack(isOK);
    }

    private disconect(socket: SocketIO.Socket, reason: string): void {
        try {
            this.am.delSocket(socket);
            Common.trace(Common.STATE_INFO, `${socket.handshake.address}のソケットを削除しました。${reason}`);
        } catch (error) {
            if (error.stack) Common.trace(Common.STATE_ERROR, error.stack);
        }
    }

    private sendJob(eventType: string, jobjson: SerialJobJSON, onAck: Function): void {
        try {
            const agentSocket = this.am.getSocket(jobjson.agentName);
            this.svm.putDataHeaderAndSendJob(agentSocket, jobjson, eventType, onAck);
        } catch (error) {
            this.js.finishJob(jobjson.serial, jobjson.code, '404', error.message);
        }
    }

    private receiveCollectInfo(callback: Function): void {
        const info: CollectInfo = {
            'agent': {
                'define': this.am.agentFile,
                'state': undefined
            },
            'define': {
                'MAHIRU_PORT': 17380,
                'POPLAR_PORT': 27131,
                'SCANNING_TIME': Jobscheduler.SCANNING_TIME
            },
            'jobnet': {
                'define': this.js.defineJobnet,
                'finished': this.js.getJobnet('finished'),
                'running': this.js.getJobnet('running'),
                'waitting': this.js.getJobnet('waitting')
            }
        };

        const states = new Array<AgentState>();
        this.am.agents.forEach((agent: Agent) => {
            states.push({
                'connected': agent.socket ? agent.socket.connected : false,
                'ipaddress': agent.ipaddress,
                'name': agent.name,
                'runjob': this.js.getRunningJobByAgentName(agent.name),
                'socketID': agent.socket ? agent.socket.id : ''
            });
        });

        info.agent.state = states;
        callback(info);
    }

    private receivePutDefineJobnet(newJobnet: JobnetJSON, callback: (err: Error | undefined, data: JobnetJSON[] | undefined) => void): void {
        try {
            const defineJobnet = this.js.defineJobnet;
            const index = defineJobnet.findIndex((jobnet: JobnetJSON) => jobnet.name === newJobnet.name);
            if (index >= 0) throw new PoplarException('既に同じ名前でジョブネットが定義されています。定義済みのジョブネットを編集したい場合は、jobnetNameパラメータを追加してください。');
            defineJobnet.push(newJobnet);
            this.js.defineJobnet = defineJobnet;
            this.js.initScheduleJobnets();
            callback(undefined, defineJobnet);
        } catch (error) {
            callback(error, undefined);
        }
    }

    private receiveRemoveDefineJobnet(jobnetName: string, callback: (err: Error | undefined, data: JobnetJSON[] | undefined) => void): void {
        this.receiveUpdateDefineJobnet(jobnetName, undefined, callback);
    }

    private receiveUpdateDefineJobnet(jobnetName: string, newJobnet: JobnetJSON | undefined, callback: (err: Error | undefined, data: JobnetJSON[] | undefined) => void): void {
        try {
            const defineJobnet = this.js.defineJobnet;
            const index = defineJobnet.findIndex((v: JobnetJSON) => v.name === jobnetName);
            if (index < 0) {
                throw new PoplarException('指定されたジョブネットネームは定義ファイルに存在しません。');
            }
            if (typeof newJobnet === 'undefined') {
                defineJobnet.splice(index, 1);
            } else {
                defineJobnet.splice(index, 1, newJobnet);
            }
            this.js.defineJobnet = defineJobnet;
            callback(undefined, defineJobnet);
        } catch (error) {
            callback(error, undefined);
        }
    }

    private receivePauseRunningJobnet(serial: string, jobcode: string | undefined, callback: (err: Error | undefined, data: Jobnet | undefined) => void): void {
        if (jobcode) {
            this.changeStateJob(serial, jobcode, Common.STATE_PAUSE, callback);
        } else {
            this.changeStateJobnet(serial, Common.STATE_PAUSE, callback);
        }
    }

    private receiveStopRunningJobnet(serial: string, jobcode: string | undefined, callback: (err: Error | undefined, data: Jobnet | undefined) => void): void {
        try {
            if (jobcode) {
                this.js.killJobForce(serial, jobcode);
            } else {
                const jobnet = this.js.findJobnet(serial);
                if (typeof jobnet === 'undefined') throw new PoplarException(`指定されたジョブネットシリアル番号（${serial}）は存在しません。`);
                jobnet.jobs.forEach((job: Job) => {
                    this.js.killJobForce(serial, job);
                });
            }
            callback(undefined, this.js.findJobnet(serial));
        } catch (error) {
            callback(error, undefined);
        }
    }

    private receivePassRunningJobnet(serial: string, jobcode: string | undefined, callback: (err: Error | undefined, data: Jobnet | undefined) => void): void {
        if (jobcode) {
            this.changeStateJob(serial, jobcode, Common.STATE_PASS, callback);
        } else {
            this.changeStateJobnet(serial, Common.STATE_PASS, callback);
        }
    }

    private changeStateJobnet(serial: string, state: string, callback: (err: Error | undefined, data: Jobnet | undefined) => void): void {
        try {
            const jobnet = this.js.findJobnet(serial);
            if (typeof jobnet === 'undefined') throw new PoplarException(`シリアル：${serial}のジョブネットはありません。`);
            switch (state) {
                case Common.STATE_PAUSE:
                    jobnet.state = Common.STATE_PAUSE;
                    break;

                // case Common.STATE_PASS:
                //    jobnet.state = Common.STATE_PASS;
                //    break;

                default:
                    throw new PoplarException(`ステータス：${state}の代入はできません。`);
            }
            callback(undefined, jobnet);
        } catch (error) {
            callback(error, undefined);
        }
    }
    private changeStateJob(serial: string, jobcode: string | undefined, state: string, callback: (err: Error | undefined, data: Jobnet | undefined) => void): void {
        return;
    }
    private receiveRerunFinishJobnet(serial: string, callback: (err: Error | undefined, data: Jobnet | undefined) => void): void {
        return;
    }
}

const app = new App();
app.start();
