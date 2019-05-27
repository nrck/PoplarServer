import * as sqlite3 from 'sqlite3';

/**
 * Sqliter
 */
export class Sqliter {
    /** db */
    private _db: sqlite3.Database;

    /** init */
    constructor(filename: string) {
        this._db = new sqlite3.Database(filename);
    }

    /** get */
    public get Database(): sqlite3.Database {
        return this._db;
    }

    /** hoge */
    public async CreateTableIfNotExists(): Promise<void> {
        const promise = new Promise<void>(
            // tslint:disable-next-line:no-any
            (resolve: () => void, reject: (reason?: any) => void): void => {
                try {
                    this.Database.serialize(() => {
                        this.Database.run(`create table if not exists hoge (
                        account text primary key,
                        name text,
                        email text
                        )`
                        );
                    });

                    resolve();
                } catch (err) {
                    reject(err);
                }
            });

        return promise;
    }
}
