import { Connection, ConnectionOptions, createConnection } from 'typeorm';
import { Agent } from './Agent';

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
            Agent
        ],
        'synchronize': true,
        'type': 'sqlite'
    };

    /** if the database connection is not created, This instance create a connection and return new one. */
    public static async createConnection(): Promise<Connection> {
        if (typeof this._conn === 'undefined') {
            this._conn = await createConnection(this.connectionOptions);
            console.log('接続しました');
        }

        return this._conn;
    }
}
