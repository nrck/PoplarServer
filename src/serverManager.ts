import { EventEmitter } from 'events';
import * as SocketIO from 'socket.io';
import { Common } from './common';
import { DataHeaderJSON, HelloJSON, SendJobJSON, SerialJobJSON } from './interface';

export class ServerManager {
    private _server: SocketIO.Server;
    private _port: number;
    private _events: EventEmitter;
    private _no: number;

    constructor(port: number, no: number, server?: SocketIO.Server) {
        this._port = port;
        this._server = typeof server === 'undefined' ? SocketIO() : server;
        this._events = new EventEmitter();
        this._no = no;
    }

    public get port(): number {
        return this._port;
    }

    public get server(): SocketIO.Server {
        return this._server;
    }

    public get events(): EventEmitter {
        return this._events;
    }

    public get no(): number {
        this._no++;

        return this._no;
    }

    /**
     * PoplarServerサーバを開始します。
     */
    public start(): void {
        this.server.listen(this.port);
        Common.trace(Common.STATE_INFO, `PoplarServerを${this.port}番ポートで起動しました。`);
    }

    /**
     * PoplarServerサーバを停止します。
     */
    public stop(): void {
        this.server.close();
        Common.trace(Common.STATE_INFO, 'PoplarServerを停止しました。');
    }

    /**
     * サーバの初期化処理を行い、サーバを開始します。
     */
    public initServer(): void {
        // TODO: namespaceを利用してFEP向けの処理を書く。
        this.server.sockets.on('connection', (socket: SocketIO.Socket): void => this.connection(socket));
        this.start();
    }

    /**
     * コネクション接続時のイベント登録を行います。
     */
    private connection(socket: SocketIO.Socket): void {
        // ログ
        Common.trace(Common.STATE_INFO, `${socket.handshake.address}から接続されました。`);

        // 承認イベント
        socket.on(Common.EVENT_HELLO, (data: HelloJSON, ack: Function): void => this.receiveHello(socket, data, ack));

        // ジョブ実行結果イベント
        socket.on(Common.EVENT_SEND_JOB_RESULT, (data: SendJobJSON): void => this.jobresult(socket, data));

        // 切断イベント
        socket.on(Common.EVENT_DISCONNECT, (reason: string): void => this.disconnect(socket, reason));
    }

    /**
     * 切断時にイベント発火し、Appへ通知します。
     * @param socket 切断されたソケット
     * @param reason 切断理由
     */
    private disconnect(socket: SocketIO.Socket, reason: string): void {
        Common.trace(Common.STATE_INFO, `${reason}のため、${socket.handshake.address}から切断されました。`);
        this.events.emit(Common.EVENT_DISCONNECT, socket, reason);
    }

    /**
     * 認証要求時にイベント発火し、Appへ通知します。
     * @param socket ソケット
     * @param data 受信したHelloJSON
     */
    private receiveHello(socket: SocketIO.Socket, data: HelloJSON, ack:Function): void {
        Common.trace(Common.STATE_INFO, `${socket.handshake.address}(${data.header.from})からの認証要求がありました。`);
        Common.trace(Common.STATE_DEBUG, `${JSON.stringify(data)}`);
        this.events.emit(Common.EVENT_RECEIVE_HELLO, socket, data.data, ack);
    }

    /**
     * ジョブ実行結果受診時にイベント発火し、Appへ通知します。
     * @param socket ソケット
     * @param data 受信したSendJobJSON
     */
    private jobresult(socket: SocketIO.Socket, data: SendJobJSON): void {
        Common.trace(Common.STATE_INFO, `${socket.handshake.address}(${data.header.from})からジョブ実行結果:${data.data.returnCode}が返されました。`);
        this.events.emit(Common.EVENT_SEND_JOB_RESULT, socket, data);
    }

    /**
     * データヘッダーを付加してメッセージを送付します。
     * @param socket 送信先のソケット
     * @param serialJob シリアルジョブ
     * @param eventType イベントタイプ
     * @param onAck Ack
     */
    public putDataHeaderAndSendJob(socket: SocketIO.Socket, serialJob: SerialJobJSON, eventType: string, onAck: Function): void {
        // eventTypeの確認
        switch (eventType) {
            case Common.EVENT_SEND_JOB: break;
            case Common.EVENT_KILL_JOB: break;
            default:
                Common.trace(Common.STATE_ERROR, `putDataHeaderAndSendJobで未定義のイベントが引数に渡されました。eventType=${eventType}`);

                return;
        }

        // SendJobJSONの作成
        const sendJobJSON: SendJobJSON = {
            'data': serialJob,
            'header': this.createDataHeader(false, serialJob.agentName, eventType)
        };

        Common.trace(Common.STATE_INFO, `${socket.handshake.address}(${sendJobJSON.header.to})にタイプ${eventType}、シリアル${sendJobJSON.data.serial}、ジョブコード${sendJobJSON.data.code}を送信しました。`);
        socket.emit(eventType, sendJobJSON, onAck);
    }

    /**
     * 承認要求への返答を送信します。
     * @param socket 送信先ソケット
     * @param data 送信するHelloJSON
     */
    public static resHello(socket: SocketIO.Socket, data: HelloJSON): void {
        Common.trace(Common.STATE_INFO, `${socket.handshake.address}(${data.header.to})に承認結果${data.header.type}を返します。`);
        socket.emit(Common.EVENT_HELLO, data);
    }

    /**
     * データヘッダーを作成します。
     * @param isResponse 返信データか？
     * @param to 宛先エージェント名
     * @param type タイプ
     */
    public createDataHeader(isResponse: false | [true, number], to: string, type: string): DataHeaderJSON {
        const header: DataHeaderJSON = {
            'from': Common.ENV_SERVER_HOST,
            'isResponse': isResponse,
            'no': this.no,
            'timestamp': new Date(),
            'to': to,
            'type': type
        };

        return header;
    }
}

