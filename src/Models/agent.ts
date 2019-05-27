import { Model } from 'sequelize';
/**
 * Agent class
 */
export class Agent extends Model<Agent> {
    public socket?: SocketIO.Socket;
    public readonly id!: number;
    public name!: string;
    public ipaddress!: string;
    public sharekey!: string;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}
