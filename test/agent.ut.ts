import { Agent } from '../src/Models/Agent';
import { AgentController, IAgentListResponse, IAgentResponse } from '../src/Models/AgentController';

async function Test() {
    const a = new Agent();
    a.ipaddress = '127.0.0.1';
    a.name = 'test3';
    a.sharekey = 'pass';

    await AgentController
        .add({ 'agent': a })
        .then((res: IAgentResponse): void => {
            if (res.agent === undefined) return;

            console.log(`#${res.state}# ${res.message}`);
            console.log(`${res.timestamp.toDateString()}: ${res.total}`);
        })
        .catch((reason: IAgentResponse): void => {
            console.error(`#${reason.state}# ${reason.message}`);
        });

    await AgentController
        .all({})
        .then((res: IAgentListResponse): void => {
            console.log(`#${res.state}# ${res.message}`);
            console.log(`${res.timestamp.toDateString()}: ${res.total}`);
        })
        .catch((reason: IAgentListResponse): void => {
            console.error(`#${reason.state}# ${reason.message}`);
            console.log(`${reason.timestamp.toDateString()}: ${reason.total}`);
        });

    a.sharekey = 'pass2';
    await AgentController
        .update({ 'agent': a })
        .then((res: IAgentResponse): void => {
            console.log(`#${res.state}# ${res.message}`);
            console.log(`${res.timestamp.toDateString()}: ${res.total}`);
        })
        .catch((reason: IAgentResponse): void => {
            console.error(`#${reason.state}# ${reason.message}`);
            console.log(`${reason.timestamp.toDateString()}: ${reason.total}`);
        });

    const b = new Agent();
    b.ipaddress = '127.0.0.1';
    b.name = 'test4';
    b.sharekey = 'pass';

    await AgentController
        .add({ 'agent': b })
        .then((res: IAgentResponse): void => {
            console.log(`#${res.state}# ${res.message}`);
            console.log(`${res.timestamp.toDateString()}: ${res.total}`);
        })
        .catch((reason: IAgentResponse): void => {
            console.error(`#${reason.state}# ${reason.message}`);
            console.log(`${reason.timestamp.toDateString()}: ${reason.total}`);
        });
}

Test();
