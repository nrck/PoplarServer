import { Connection, ConnectionOptions, createConnection } from 'typeorm';
import { Agent } from './Agent';
import { JobnetNode } from './JobnetNode';
import { MasterJob } from './MasterJob';
import { MasterJobnet } from './MasterJobnet';
import { RunJob } from './RunJob';

/**
 * Sqlite3 Data Store Class
 */
export class DataStore {
    /** Database connection */
    private static _conn?: Connection;

    /** database.sqlite */
    public static connectionOptions: ConnectionOptions = {
        'database': 'database.sqlite',
        'entities': [
            Agent,
            MasterJob,
            RunJob,
            JobnetNode,
            MasterJobnet
        ],
        'synchronize': true,
        'type': 'sqlite'
    };

    /** if the database connection is not created, This instance create a connection and return new one. */
    public static async createConnection(): Promise<Connection> {
        if (typeof this._conn === 'undefined') {
            this._conn = await createConnection(this.connectionOptions);
            console.log('Connection created successfully.');
        }

        return this._conn;
    }
}
