/**  */
export interface IBaseResponse {
    /** Number of processing */
    'total': number;
    /** Time of create at */
    'timestamp': Date;
    /** State of the response */
    'state': number;
    /** The response message */
    'message': string;
}
