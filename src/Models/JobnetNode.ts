import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class JobnetNode extends BaseEntity {
    @PrimaryGeneratedColumn()
    public readonly id!: number;

    @Column()
    public jobnetId: number;

    @Column()
    public sorceJobId: number;

    @Column()
    public targetSuccessJobId: number;

    @Column()
    public targetErrorJobId: number;
}