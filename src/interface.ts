/**
 * ジョブインターフェース
 */
export interface Job extends JobJSON {
    /** ジョブの状態 */
    state: string;
    /** リターンコード */
    returnCode?: string;
    /** エラーメッセージ */
    exceptionMes?: string;
    /** 実開始時刻 */
    startTime?: Date;
    /** 実終了時刻 */
    finishTime?: Date;
}

/**
 * ジョブネットインターフェース
 */
export interface Jobnet extends JobnetJSON {
    /** シリアル番号。一意に振られる */
    serial: string;
    /** 定義ジョブ */
    jobs: Job[];
    /** 事前処理開始時刻 */
    queTime: Date;
    /** 実開始時刻 */
    startTime?: Date;
    /** 実終了時刻 */
    finishTime?: Date;
    /** ジョブネット状態 */
    state: string;
    /** 実行結果 */
    result?: string; // これstateで代用できるんじゃね？
    /** エラーメッセージ */
    exceptionMes?: string;
}

/**
 * ジョブ実行スケジュールインターフェース
 */
export interface RunDate {
    /** 実行月 */
    month: {
        operation: string;
        work?: number[];
    };
    /** 実行日 */
    day: {
        operation: string;
        weekday?: number[];
        work?: number[];
    };
    /** 開始時刻 */
    start: {
        time: string;
        enable: true;
    } | {
        enable: false;
    };
    /** 遅延警告時刻 */
    delay: {
        time: string;
        enable: true;
    } | {
        enable: false;
    };
    /** 打ち切り時刻 */
    deadline: {
        time: string;
        enable: true;
    } | {
        enable: false;
    };
}

/**
 * ジョブネット定義ファイルインターフェース
 */
export interface JobnetFile {
    /** ヘッダー */
    header: {
        /** ファイルバージョン */
        filever: string;
        /** 作成日 */
        createdate: Date;
    };
    /** 定義されたジョブネット */
    jobnets: JobnetJSON[];
}

/**
 * JSON形式ジョブネット
 */
export interface JobnetJSON {
    /** ジョブネット名 */
    name: string;
    /** 有効無効 */
    enable: boolean; // 定義ファイルには必要だけど、オブジェクトにはいるか？
    /** 説明文 */
    info: string;
    /** 実行スケジュール */
    schedule: RunDate;
    /** 実行順序定義行列 */
    nextMatrix: number[][];
    /** エラー時実行順序定義行列 */
    errorMatrix: number[][];
    /** 実行ジョブ */
    jobs: JobJSON[];
}

/**
 * JSON形式ジョブ
 */
export interface JobJSON {
    /** ジョブコード。他のジョブとは重複してはいけない。 */
    code: string;
    /** 実行対象のエージェントネーム */
    agentName: string;
    /** ジョブの説明文 */
    info: string;
    /** ジョブの実行スケジュール */
    schedule: RunDate;
    /** ユニークジョブ？ */
    isSpecial: boolean;
    /** 実行対象のファイル */
    file?: string;
    /** 実行するディレクトリ */
    cwd?: string;
    /** 実行時の引数 */
    args?: string[];
}

/**
 * JSON形式エージェント
 */
export interface AgentJSON {
    /** エージェント名 */
    name: string;
    /** エージェントIPアドレス */
    ipaddress: string;
    /** 共有キー */
    sharekey: string;
}

/**
 * サーバクライアント間の通信ヘッダ
 */
export interface DataHeaderJSON {
    /** データ・タイプ */
    type: string;
    /** 送信時刻 */
    timestamp: Date;
    /** 送信元 */
    from: string;
    /** 送信先 */
    to: string;
    /** データシーケンスNo. */
    no: number;
    /** レスポンスか否か */
    isResponse: false | [true, number];
}

/**
 * 承認データ形式
 */
export interface HelloJSON {
    /** 通信ヘッダ */
    header: DataHeaderJSON;
    /** 承認データ */
    data: AgentJSON;
}

/**
 * シリアル番号付きJSON形式ジョブ
 */
export interface SerialJobJSON extends JobJSON {
    /** シリアル番号 */
    serial: string;
    /** リターンコード */
    returnCode?: string;
    /** エラーメッセージ */
    exceptionMes?: string;
}

/**
 * ジョブデータ形式
 */
export interface SendJobJSON {
    /** 通信ヘッダ */
    header: DataHeaderJSON;
    /** ジョブデータ */
    data: SerialJobJSON;
}

/**
 * API用コンテキストフィードサンドボックス
 */
export interface ApiContextifiedSandbox {
    /** requestオブジェクト */
    request: Express.Request;
    /** responseオブジェクト */
    response: Express.Response;
    /** 各種モジュールです。 */
    module?: {
        /** fsモジュール */
        fs: NodeJS.Module;
        /** vmモジュール */
        vm: NodeJS.Module;
        /** Job Working!インターフェース */
        IF: NodeJS.Module;
        /** child_processモジュール */
        child_process: NodeJS.Module;
    };
    /** 各種定義値です。 */
    define: {
        /** Poplarサーバのリッスンポート */
        POPLAR_PORT: number;
        /** Mahiruサーバのリッスンポート */
        MAHIRU_PORT: number;
        /** ジョブネットスケジューリング間隔（ms） */
        SCANNING_TIME: number;
    };
    /** エージェント情報です。 */
    agent: {
        /** エージェント定義 */
        define: AgentJSON[] | undefined;
        /** エージェント状態 */
        state: {
            /** エージェント名 */
            name: string;
            /** IPアドレス */
            ipaddress: string | undefined;
            /** ソケットID */
            socketID: string | undefined;
            /** 接続済みフラグ */
            connected: boolean;
            /** 実行中ジョブ */
            runjob: SerialJobJSON[] | undefined;
        }[] | undefined;
    };
    /** ジョブネット情報です。 */
    jobnet: {
        /** ジョブネット定義 */
        define: JobnetJSON[] | undefined;
        /** 開始待ちジョブネット */
        waitting: Jobnet[] | undefined;
        /** 実行中ジョブネット */
        running: Jobnet[] | undefined;
        /** 終了済みジョブネット */
        finished: Jobnet[] | undefined;
    };
}
