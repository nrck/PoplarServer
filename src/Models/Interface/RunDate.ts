import { RunDayDesignatedDay, RunDayDesignatedWeekday, RunDayEvery, RunDayHoliday, RunDayWorkday, RunMonthDesignated, RunMonthEvery } from '../Types/RunOperations';

export interface RunDate {
    month: {
        operation: RunMonthEvery;
        work?: number[];
    } | {
        operation: RunMonthDesignated;
        work: number[];
    };
    day: {
        operation: RunDayEvery | RunDayHoliday | RunDayWorkday;
        weekday?: number[];
        work?: number[];
    } | {
        operation: RunDayDesignatedDay;
        weekday?: number[];
        work: number[];
    } | {
        operation: RunDayDesignatedWeekday;
        weekday: number[];
        work?: number[];
    };
    start: string | undefined;
    delay: string | undefined;
    deadline: string | undefined;
}

