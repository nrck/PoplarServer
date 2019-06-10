/** State of sending job info to an agent */
export declare type JobStateSenndingJob = 'SendingJob';

/** State of sending SIGKILL to an agent */
export declare type JobStateSendingKill = 'SendingSIGKILL';

/** Agent killing to job */
export declare type JobStateKilling = 'Killing';

/** State of running */
export declare type JobStateRunning = 'Running';

/** State of waiting on start time */
export declare type JobStateWaitingStartTime = 'WaitingStartTime';

/** State of waiting to previous job be finished */
export declare type JobStateWaitingPreviousJob = 'WaitingPreviousJob';

/** State of pause */
export declare type JobStatePause = 'Pause';

/** State of pass */
export declare type JobStatePass = 'Pass';

/** State of OK */
export declare type JobStateFinishOK = 'Finish';

/** State of job is killed */
export declare type JobStateFinishKilled = 'Killed';

/** State of job is error */
export declare type JobStateFinishError = 'Error';

/** State of job finished. but that is delay */
export declare type JobStateFinishDelay = 'Delay';

/** State of job finished. but that is over deadline */
export declare type JobStateFinishDeadline = 'Deadline';

/** Group of finish(NG) states */
export declare type JobStateFinishNG = JobStateFinishKilled | JobStateFinishError | JobStateFinishDelay | JobStateFinishDeadline;

/** Group of finish states */
export declare type JobStateFinish = JobStateFinishOK | JobStateFinishNG;

/** Group of waiting states */
export declare type JobStateWaiting = JobStateWaitingStartTime | JobStateWaitingPreviousJob;

/** Group of controlling states */
export declare type JobStateControlling = JobStateSenndingJob | JobStateSendingKill | JobStateKilling | JobStatePause | JobStatePass;

/** Jobs have a state what it is doing now */
export declare type JobState = JobStateRunning | JobStateFinish | JobStateWaiting | JobStateControlling;
