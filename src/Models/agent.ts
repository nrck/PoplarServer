import { BaseEntity, Column, Entity, Generated, Index, PrimaryColumn, PrimaryGeneratedColumn, Unique } from 'typeorm';

export interface IAgent {
    socket?: SocketIO.Socket;
    id: number;
    name: string;
    ipaddress: string;
    sharekey: string;
}

@Entity()
@Unique('UQ_IP_NAME', ['ipaddress', 'name'])
export class Agent extends BaseEntity implements IAgent {
    public socket?: SocketIO.Socket;

    @PrimaryGeneratedColumn()
    public readonly id!: number;

    @Column('text', { 'nullable': false })
    public name!: string;

    @Column('text', { 'nullable': false })
    @Index()
    public ipaddress!: string;

    @Column('text', { 'nullable': false })
    public sharekey!: string;
}
