import { AgentManager } from './agentManager';
import { Common } from './common';
import { SerialJobJSON, AgentJSON } from './interface';
import { Jobscheduler } from './jobscheduler';
import { ServerManager } from './serverManager';

class App {
    // tslint:disable-next-line:no-magic-numbers
    private svm = new ServerManager(27133, 0);
    private js = new Jobscheduler('./config/jobnet.json', 0);
    private am = new AgentManager('./config/agent.json');

    public start(): void {
        try {
            // サーバー初期化
            this.svm.initServer();
            // Hello受信
            this.svm.events.on(Common.EVENT_RECEIVE_HELLO, (socket: SocketIO.Socket, data: AgentJSON, ack:Function) => this.receiveHello(socket, data,ack));
            // 切断イベント受信
            this.svm.events.on(Common.EVENT_DISCONNECT, (socket: SocketIO.Socket, reason: string) => this.disconect(socket, reason));
            // ジョブ実行結果受信
            this.svm.events.on(Common.EVENT_RECEIVE_SCHEDULE_RELOAD, () => this.js.events.emit(Common.EVENT_RECEIVE_SCHEDULE_RELOAD));

            // ジョブ送信
            this.js.events.on(Common.EVENT_SEND_JOB, (jobjson: SerialJobJSON, onAck: Function) => this.sendJob(Common.EVENT_SEND_JOB, jobjson, onAck));
            // ジョブ強制終了送信
            this.js.events.on(Common.EVENT_KILL_JOB, (jobjson: SerialJobJSON, onAck: Function) => this.sendJob(Common.EVENT_KILL_JOB, jobjson, onAck));
        } catch (error) {
            Common.trace(Common.STATE_ERROR, error.stack);
            this.start();
        }
    }

    private receiveHello(socket: SocketIO.Socket, data: AgentJSON,ack:Function): void {
        const isOK = this.am.checkShareKey(data.name, data.sharekey) && !this.am.isExistSocket(data.name)
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
}

const app = new App();
app.start();

