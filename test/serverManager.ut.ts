import * as chai from 'chai';
import * as io from 'socket.io-client';
import { HelloJSON } from '../src/interface';
import { ServerManager } from '../src/serverManager';

describe('ServerManagerクラスの単体テスト', () => {
    const config = './config/config.json';
    describe('サーバの基本動作テスト', () => {
        // tslint:disable-next-line:no-magic-numbers
        const sm = new ServerManager(config, 0);

        it('サーバーの初期化処理', () => {
            chai.assert.doesNotThrow(() => { sm.initServer(); });
        });

        it('サーバーの終了', () => {
            chai.assert.doesNotThrow(() => { sm.stop(); });
        });
    });

    describe('コネクションの動作テスト', () => {
        const sm = new ServerManager(config, 0);

        it('サーバーの初期化処理2', () => {
            chai.assert.doesNotThrow(() => { sm.initServer(); });
        });

        const test = {
            'data': {
                'ipaddress': '192.168.2.39',
                'name': 'testAgent',
                'sharekey': '1qaz2wsx'
            },
            'header': {
                'from': 'testAgent',
                'isResponse': false,
                'no': '334',
                'timestamp': new Date(),
                'to': 'PoplarServer',
                'type': 'Hello'
            }
        };

        it('承認イベント', () => {
            sm.events.on('Hello', (s: SocketIO.Socket, d: HelloJSON) => {
                chai.assert.typeOf(s, 'SocketIO.Socket');
                chai.assert.typeOf(d, 'HelloJSON');
            });
        });

        // it('ジョブ実行結果イベント', () => {

        // });

        // it('切断イベント', () => {

        // });
        const socket = io('ws://127.0.0.1:27131');
        socket.emit('Hello', JSON.parse(JSON.stringify(test)));
        setTimeout(() => {
            socket.close();
            // tslint:disable-next-line:no-magic-numbers
        },         1000);

        it('サーバーの終了', () => {
            chai.assert.doesNotThrow(() => {
                setTimeout(() => {
                    sm.stop();
                    // tslint:disable-next-line:no-magic-numbers
                },         5000);
            });
        });
    });
});
