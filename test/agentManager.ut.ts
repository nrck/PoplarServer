import * as chai from 'chai';
import { AgentManager } from '../src/agentManager';

describe('AgentManagerクラスの単体テスト', () => {
    const path = './test/agent.test.json';
    const am = new AgentManager(path);

    describe('パスワード認証メソッド', () => {
        it('パスワードが一致する場合', () => {
            chai.assert.isTrue(am.checkShareKey('testAgent', '1qaz2wsx'));
        });

        it('パスワードが一致しない場合', () => {
            chai.assert.isFalse(am.checkShareKey('testAgent', '1111111'));
        });

        it('エージェントが存在場合', () => {
            chai.assert.isFalse(am.checkShareKey('testAgentああああ', '1111111'));
        });
    });

    describe('IPアドレス認証メソッド', () => {
        it('IPアドレスが一致する場合', () => {
            chai.assert.isTrue(am.checkIPaddress('testAgent', '192.168.2.39'));
        });

        it('IPアドレスが一致しない場合', () => {
            chai.assert.isFalse(am.checkIPaddress('testAgent', '192.168.2.38'));
        });

        it('エージェントが存在しない場合', () => {
            chai.assert.isFalse(am.checkIPaddress('hogehoge', '192.168.2.39'));
        });
    });
});
