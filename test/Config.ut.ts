import { loadConfig } from '../src/Util/Config';
import * as log from '../src/Util/Log';

log.trace(JSON.stringify(loadConfig()));
log.trace(loadConfig().isAutoSchedule);

process.env.SERVER_CONFIG_PATH = './config/hogehoge';

log.trace(JSON.stringify(loadConfig()));
log.trace(loadConfig().isAutoSchedule);


process.env.SERVER_CONFIG_PATH = './config/agent.json';
log.trace(JSON.stringify(loadConfig()));
log.trace(loadConfig().isAutoSchedule);
