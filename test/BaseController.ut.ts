import { BaseController } from '../src/Models/BaseController';
import { MasterJobnet } from '../src/Models/MasterJobnet';
import { info } from '../src/Util/Log';
import { RunJobnet } from '../src/Models/RunJobnet';
import { JobnetNode } from '../src/Models/JobnetNode';

const newobj = new MasterJobnet();
newobj.enable = true;
newobj.info = 'テストジョブネット';
newobj.name = 'テスト1750(Node有り)';
newobj.schedule = {
    'day': {
        'operation': 'Holiday'
    },
    'deadline': undefined,
    'delay': undefined,
    'month': {
        'operation': 'EveryMonth'
    },
    'start': '17:50'
};

const Test = async () => {
    const a = await BaseController.add(MasterJobnet, newobj);

    return a;
}

Test().then((res) => info(res.message)).catch();
