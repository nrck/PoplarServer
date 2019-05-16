/**
 * Agent class
 */
export class Agent {
    socket: SocketIO.Socket | undefined;
    name: string;
    ipaddress: string;
    sharekey: string;

    constructor(name: string, ipaddress: string, sharekey: string) {
        this.socket = undefined;
        this.name = name;
        this.ipaddress = ipaddress;
        this.sharekey = sharekey;
    }
}
