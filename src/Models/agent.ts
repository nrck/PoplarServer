import { BaseEntity, Column, Entity, Index, PrimaryGeneratedColumn, Unique } from 'typeorm';

export interface IAgent {
    /** Web Socket object */
    socket?: SocketIO.Socket;
    /** Agent ID. This is Primary key. */
    id: number;
    /** Agent name. Agent name must be unique in same ip address. */
    name: string;
    /** This ip address is that agent be hosted machine's */
    ipaddress: string;
    /** Agent and server shared key. */
    sharekey: string;
}

/**
 * Agent class. This class extend BaseEntity.
 */
@Entity()
@Unique('UQ_IP_NAME', ['ipaddress', 'name'])
export class Agent extends BaseEntity implements IAgent {
    /** Web Socket object */
    public socket?: SocketIO.Socket;

    /** Agent ID. This is Primary key. */
    @PrimaryGeneratedColumn()
    public readonly id!: number;

    /** Agent name. Agent name must be unique in same ip address. */
    @Column('text', { 'nullable': false })
    public name!: string;

    /** This ip address is that agent be hosted machine's */
    @Column('text', { 'nullable': false })
    @Index()
    public ipaddress!: string;

    /** Agent and server shared key. */
    @Column('text', { 'nullable': false })
    public sharekey!: string;
}
