import { Agent } from '../src/Models/Agent';
import { BaseController, IResponse } from '../src/Controllers/BaseController';
import * as log from '../src/Util/Log';

async function Test() {
    log.trace('started');
    const a = new Agent();
    a.ipaddress = '127.0.0.1';
    a.name = 'test3';
    a.sharekey = 'pass';

    await BaseController
        .add(Agent, a)
        .then((res: IResponse<Agent>): void => {
            if (res.entity === undefined) return;

            log.info(`#${res.state}# ${res.message}`);
        })
        .catch((reason: IResponse<Agent>): void => {
            log.error(`#${reason.state}# ${reason.message}`);
        });

    await BaseController
        .all(Agent, {})
        .then((res: IResponse<Agent>): void => {
            log.info(`#${res.state}# ${res.message}`);
        })
        .catch((reason: IResponse<Agent>): void => {
            log.error(`#${reason.state}# ${reason.message}`);
        });

    a.sharekey = 'pass2';
    await BaseController
        .update(Agent, a, { 'name': a.name, 'ipaddress': a.ipaddress })
        .then((res: IResponse<Agent>): void => {
            log.info(`#${res.state}# ${res.message}`);
        })
        .catch((reason: IResponse<Agent>): void => {
            log.error(`#${reason.state}# ${reason.message}`);
        });

    const b = new Agent();
    b.ipaddress = '127.0.0.1';
    b.name = 'test4';
    b.sharekey = 'pass';

    await BaseController
        .add(Agent, b)
        .then((res: IResponse<Agent>): void => {
            log.info(`#${res.state}# ${res.message}`);
        })
        .catch((reason: IResponse<Agent>): void => {
            log.error(`#${reason.state}# ${reason.message}`);
        });


    await BaseController
        .delete(Agent, 1)
        .then((res: IResponse<Agent>): void => {
            log.info(`#${res.state}# ${res.message}`);
        })
        .catch((reason: IResponse<Agent>): void => {
            log.error(`#${reason.state}# ${reason.message}`);
        });
}


Test();
