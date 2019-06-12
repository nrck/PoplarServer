export declare type RunMonthEvery = 'EveryMonth';
export declare type RunMonthDesignated = 'DesignatedMonth';
export declare type RunMonth = RunMonthEvery | RunMonthDesignated;

export declare type RunDayEvery = 'EveryDay';
export declare type RunDayWorkday = 'Workday';
export declare type RunDayHoliday = 'Holiday';
export declare type RunDayDesignatedWeekday = 'DesignatedWeekday';
export declare type RunDayDesignatedDay = 'DesignatedDay';
export declare type RunDay = RunDayEvery | RunDayWorkday | RunDayHoliday | RunDayDesignatedWeekday | RunDayDesignatedDay;
