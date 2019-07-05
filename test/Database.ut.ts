import { MasterJobnetController } from '../src/Controllers/MasterJobnetController';
import { Agent } from '../src/Models/Agent';
import { BaseController } from '../src/Controllers/BaseController';
import { JobnetNode } from '../src/Models/JobnetNode';
import { MasterJob } from '../src/Models/MasterJob';
import { MasterJobnet } from '../src/Models/MasterJobnet';
import * as log from '../src/Util/Log';


// tslint:disable-next-line: space-before-function-paren
const fn = async (): Promise<void> => {
    const agent = new Agent();
    agent.ipaddress = '127.0.0.1';
    agent.name = 'localhost';
    agent.sharekey = 'password';
    const savedAgent = await BaseController.add(Agent, agent);
    log.trace(savedAgent.message);

    const job1 = new MasterJob();
    job1.info = 'Start';
    job1.isControlJob = true;
    job1.agent = savedAgent.entity as Agent;
    job1.schedule = {
        'day': {
            'operation': 'EveryDay'
        },
        'deadline': undefined,
        'delay': undefined,
        'month': {
            'operation': 'EveryMonth'
        },
        'start': undefined
    };
    const savedJob1 = await BaseController.add(MasterJob, job1);
    log.trace(savedJob1.message);

    const job2 = new MasterJob();
    job2.info = 'End';
    job2.isControlJob = true;
    job2.agent = savedAgent.entity as Agent;
    job2.schedule = {
        'day': {
            'operation': 'EveryDay'
        },
        'deadline': undefined,
        'delay': undefined,
        'month': {
            'operation': 'EveryMonth'
        },
        'start': undefined
    };
    const savedJob2 = await BaseController.add(MasterJob, job2);
    log.trace(savedJob2.message);

    const jobnet = new MasterJobnet();
    jobnet.enable = true;
    jobnet.info = 'test';
    jobnet.name = 'Test';
    jobnet.schedule = {
        'day': {
            'operation': 'EveryDay'
        },
        'deadline': undefined,
        'delay': undefined,
        'month': {
            'operation': 'EveryMonth'
        },
        'start': '12:00'
    };
    const savedJobnet = await BaseController.add(MasterJobnet, jobnet);
    log.trace(savedJobnet.message);

    const node = new JobnetNode();
    node.masterJobnet = savedJobnet.entity as MasterJobnet;
    node.sourceJob = savedJob1.entity as MasterJob;
    node.targetErrorJob = savedJob2.entity as MasterJob;
    node.targetSuccessJob = savedJob2.entity as MasterJob;
    const savedNode = await BaseController.add(JobnetNode, node);
    log.trace(savedNode.message);

    const jobnets = (await MasterJobnetController.get(1)).entity as MasterJobnet;
    log.trace(JSON.stringify(jobnets, undefined, '  '));
    if (jobnets.nodes !== undefined) {
        log.trace(jobnets.nodes[0].sourceJob);
    }

    const jobnet1 = await BaseController.get(MasterJobnet, 1);
    log.trace(jobnet1.entity);
};

fn()
    .then()
    .catch();
