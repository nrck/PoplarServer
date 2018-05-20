/**
 * Agent class
 */
export class Agent {
    private _socket: SocketIO.Socket | undefined;
    private _name: string;
    private _ipaddress: string;
    private _sharekey: string;

    constructor(name: string, ipaddress: string, sharekey: string) {
        this._socket = undefined;
        this._name = name;
        this._ipaddress = ipaddress;
        this._sharekey = sharekey;
    }

    public get socket(): SocketIO.Socket | undefined {
        return this._socket;
    }

    public set socket(value: SocketIO.Socket | undefined) {
        this._socket = value;
    }

    public get name(): string {
        return this._name;
    }

    public set name(value: string) {
        this._name = value;
    }

    public get ipaddress(): string {
        return this._ipaddress;
    }

    public set ipaddress(value: string) {
        this._ipaddress = value;
    }

    public get sharekey(): string {
        return this._sharekey;
    }

    public set sharekey(value: string) {
        this._sharekey = value;
    }
}
