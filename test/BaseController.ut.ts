import { BaseController } from '../src/Models/BaseController';
import { MasterJobnet } from '../src/Models/MasterJobnet';
import { info } from '../src/Util/Log';
import { RunJobnet } from '../src/Models/RunJobnet';

const newobj = new MasterJobnet();
newobj.enable = true;
newobj.info = 'テストジョブネット';
newobj.name = 'テスト1413';
newobj.schedule = {
    'day': {
        'operation': 'EveryDay'
    },
    'deadline': undefined,
    'delay': undefined,
    'month': {
        'operation': 'EveryMonth'
    },
    'start': '14:13'
};

const Test = async () => {
    const a = await BaseController.get(RunJobnet, 1);
    const e = a.entity as RunJobnet;
    e.state = 'WaitingStartTime';

    info('add is ok');
    const b = await BaseController.update(MasterJobnet, e, { 'id': e.id });

    return b;
}

Test().then((res) => info(res.message)).catch();
