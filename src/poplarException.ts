import { Common } from './common';

export class PoplarException implements Error {
    public name = 'PoplarException';
    public message: string;
    public stack: string | undefined;

    constructor(message: string, stack?: string) {
        this.message = message;
        this.stack = stack;
        Common.trace(Common.STATE_ERROR, message);
    }

    public toString(): string {
        return `${this.name}: ${this.message}`;
    }

}
