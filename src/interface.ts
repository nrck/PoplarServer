export interface JobDATE {
    month: number;
    day: number;
    hour: number;
    minutes: number;
    week: number;
    workday: boolean;
}

export interface RunDate {
    month: {
        operation: string;
        work?: number[];
    };
    day: {
        operation: string;
        weekday?: number[];
        work?: number[];
    };
    start: {
        time: string;
        enable: true;
    } | {
        enable: false;
    };
    delay: {
        time: string;
        enable: true;
    } | {
        enable: false;
    };
    deadline: {
        time: string;
        enable: true;
    } | {
        enable: false;
    };
}

export interface JobnetFile {
    header: {
        filever: string;
        createdate: Date;
    };
    jobnets: JobnetJSON[];
}

export interface JobnetJSON {
    name: string;
    enable: boolean;
    info: string;
    schedule: RunDate;
    nextMatrix: number[][];
    errorMatrix: number[][];
    jobs: JobJSON[];
}

export interface JobJSON {
    code: string;
    agentName: string;
    info: string;
    schedule: RunDate;
    file: string;
    args?: string[];
}

export interface AgentJSON {
    name: string;
    ipaddress: string;
    sharekey: string;
}

export interface DataHeaderJSON {
    type: string;
    timestamp: Date;
    from: string;
    to: string;
    no: number;
    isResponse: false | [true, number];
}

export interface HelloJSON {
    header: DataHeaderJSON;
    data: AgentJSON;
}

export interface SerialJobJSON extends JobJSON {
    serial: string;
    returnCode?: string;
    exceptionMes?: string;
}

export interface SendJobJSON {
    header: DataHeaderJSON;
    data: SerialJobJSON;
}

// FEPとのやり取り電文
