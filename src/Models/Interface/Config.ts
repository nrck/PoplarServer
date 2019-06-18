export interface IConfig {
    /** If it is true, Jobnets are scheduled automatically. */
    isAutoSchedule?: boolean;
    /** Auto scheduling interval time. It is millisecond. */
    autoScheduleIntervalTime?: number;
    /** How many days to schedule. */
    autoScheduleDays?: number;
    /** How many seconds waits for job start time. Queue starts the set value seconds before the start time. */
    queueWaitingTime?: number;
    /** Log dirctory path. */
    logDirPath?: string;
}
