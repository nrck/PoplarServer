import { Agent } from '../src/Models/Agent';
import { AgentController } from '../src/Models/AgentController';
import { IResponse } from '../src/Models/BaseController';

async function Test() {
    const a = new Agent();
    a.ipaddress = '127.0.0.1';
    a.name = 'test3';
    a.sharekey = 'pass';

    await AgentController
        .add(Agent, a)
        .then((res: IResponse<Agent>): void => {
            if (res.entity === undefined) return;

            console.log(`#${res.state}# ${res.message}`);
        })
        .catch((reason: IResponse<Agent>): void => {
            console.error(`#${reason.state}# ${reason.message}`);
        });

    await AgentController
        .all(Agent, {})
        .then((res: IResponse<Agent>): void => {
            console.log(`#${res.state}# ${res.message}`);
        })
        .catch((reason: IResponse<Agent>): void => {
            console.error(`#${reason.state}# ${reason.message}`);
        });

    a.sharekey = 'pass2';
    await AgentController
        .update(Agent, a, { 'name': a.name, 'ipaddress': a.ipaddress })
        .then((res: IResponse<Agent>): void => {
            console.log(`#${res.state}# ${res.message}`);
        })
        .catch((reason: IResponse<Agent>): void => {
            console.error(`#${reason.state}# ${reason.message}`);
        });

    const b = new Agent();
    b.ipaddress = '127.0.0.1';
    b.name = 'test4';
    b.sharekey = 'pass';

    await AgentController
        .add(Agent, b)
        .then((res: IResponse<Agent>): void => {
            console.log(`#${res.state}# ${res.message}`);
        })
        .catch((reason: IResponse<Agent>): void => {
            console.error(`#${reason.state}# ${reason.message}`);
        });


    await AgentController
        .delete(Agent, 1)
        .then((res: IResponse<Agent>): void => {
            console.log(`#${res.state}# ${res.message}`);
        })
        .catch((reason: IResponse<Agent>): void => {
            console.error(`#${reason.state}# ${reason.message}`);
        });
}

Test();
