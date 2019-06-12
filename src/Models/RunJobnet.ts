import { Column, Entity } from 'typeorm';
import { IMasterJobnet, MasterJobnet } from './MasterJobnet';
import { JobState } from './Types/State';

export interface IRunJobnet extends IMasterJobnet {
    /** Jobs state */
    state: JobState;
    /** excute start time */
    startTime?: Date;
    /** excute finish time */
    finishTime?: Date;
    /** a */
    queTime: Date;
    /** a */
    result: string;
}

@Entity()
export class RunJobnet extends MasterJobnet implements IRunJobnet {
    @Column('text', { 'nullable': false })
    public state!: JobState;
    @Column('datetime')
    public startTime: Date | undefined;
    @Column('datetime')
    public finishTime: Date | undefined;
    @Column('datetime', { 'nullable': false })
    public queTime!: Date;
    @Column('text')
    public result = '';

    public static builder(masterJobnet: MasterJobnet, queTime: Date): RunJobnet {
        const runJobnet = new RunJobnet();
        runJobnet.info = masterJobnet.info;
        runJobnet.name = masterJobnet.name;
        runJobnet.nodes = masterJobnet.nodes;
        runJobnet.schedule = masterJobnet.schedule;
        runJobnet.enable = masterJobnet.enable;

        runJobnet.state = 'WaitingStartTime';
        runJobnet.queTime = queTime;

        return runJobnet;
    }
}
