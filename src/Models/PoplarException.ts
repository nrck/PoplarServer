import * as log from '../Util/Log';

export class PoplarException extends Error {
    constructor(message: string, stack?: string) {
        super(message);
        this.name = 'PoplarException';
        this.stack = stack;

        log.error(this);
    }

    public toString(): string {
        return `${this.name}: ${this.message}`;
    }
}
