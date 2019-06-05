/** State of sending job info to an agent */
declare type JobStateSenndingJob = 'SendingJob';

/** State of sending SIGKILL to an agent */
declare type JobStateSendingKill = 'SendingSIGKILL';

/** Agent killing to job */
declare type JobStateKilling = 'Killing';

/** State of running */
declare type JobStateRunning = 'Running';

/** State of waiting on start time */
declare type JobStateWaitingStartTime = 'WaitingStartTime';

/** State of waiting to previous job be finished */
declare type JobStateWaitingPreviousJob = 'WaitingPreviousJob';

/** State of pause */
declare type JobStatePause = 'Pause';

/** State of pass */
declare type JobStatePass = 'Pass';

/** State of OK */
declare type JobStateFinishOK = 'Finish';

/** State of job is killed */
declare type JobStateFinishKilled = 'Killed';

/** State of job is error */
declare type JobStateFinishError = 'Error';

/** State of job finished. but that is delay */
declare type JobStateFinishDelay = 'Delay';

/** State of job finished. but that is over deadline */
declare type JobStateFinishDeadline = 'Deadline';

/** Group of finish(NG) states */
declare type JobStateFinishNG = JobStateFinishKilled | JobStateFinishError | JobStateFinishDelay | JobStateFinishDeadline;

/** Group of finish states */
declare type JobStateFinish = JobStateFinishOK | JobStateFinishNG;

/** Group of waiting states */
declare type JobStateWaiting = JobStateWaitingStartTime | JobStateWaitingPreviousJob;

/** Group of controlling states */
declare type JobStateControlling = JobStateSenndingJob | JobStateSendingKill | JobStateKilling | JobStatePause | JobStatePass;

/** Jobs have a state what it is doing now */
declare type JobState = JobStateRunning | JobStateFinish | JobStateWaiting | JobStateControlling;
