import { Agent } from '../src/Models/agent';
import { db, init } from '../src/Models/db';

init();

console.log('init finish');

Agent.sync({ 'force': true }).then(() =>
    Agent.create({
        'ipaddress': '0A0A0A01',
        'name': 'test',
        'sharekey': 'pass'
    })
).then(() =>
    Agent.findAll()
).then((agent: Agent[]): void => {
    console.log('All users:', JSON.stringify(agent, null, 4);
});
