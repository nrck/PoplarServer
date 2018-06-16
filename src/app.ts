import { AgentManager } from './agentManager';
import { Common } from './common';
import { HelloJSON, SerialJobJSON } from './interface';
import { Jobscheduler } from './jobscheduler';
import { ServerManager } from './serverManager';

class App {
    // tslint:disable-next-line:no-magic-numbers
    private svm = new ServerManager(27133, 0);
    private sm = new Jobscheduler('./config/jobnet.json', 0);
    private am = new AgentManager('./config/agent.json');

    public start(): void {
        try {
            this.svm.initServer();
            this.svm.events.on(Common.EVENT_HELLO, (socket: SocketIO.Socket, data: HelloJSON) => this.hello(socket, data));
            this.svm.events.on(Common.EVENT_DISCONNECT, (socket: SocketIO.Socket, reason: string) => this.disconect(socket, reason));
            this.svm.events.on(Common.EVENT_RECEIVE_SCHEDULE_RELOAD, () => this.sm.events.emit(Common.EVENT_RECEIVE_SCHEDULE_RELOAD));

            this.sm.events.on(Common.EVENT_SEND_JOB, (jobjson: SerialJobJSON, onAck: Function) => this.sendJob(Common.EVENT_SEND_JOB, jobjson, onAck));
            this.sm.events.on(Common.EVENT_KILL_JOB, (jobjson: SerialJobJSON, onAck: Function) => this.sendJob(Common.EVENT_KILL_JOB, jobjson, onAck));
        } catch (error) {
            Common.trace(Common.STATE_ERROR, error.stack);
            this.start();
        }
    }

    private hello(socket: SocketIO.Socket, data: HelloJSON): void {
        const type = this.am.checkShareKey(data.data.name, data.data.sharekey) && !this.am.isExistSocket(data.data.name) ? 'Hello' : 'RejectHello';
        if (type === Common.EVENT_HELLO) this.am.setSocket(data.data.name, socket);
        // const type = 'Hello';
        const res: HelloJSON = {
            'data': data.data,
            'header': {
                'from': 'PoplarServer',
                'isResponse': [true, data.header.no],
                'no': this.svm.no,
                'timestamp': new Date(),
                'to': data.data.name,
                'type': type
            }
        };
        ServerManager.resHello(socket, res);
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
            this.sm.finishJob(jobjson.serial, jobjson.code, '404', error.message);
        }
    }
}

const app = new App();
app.start();

