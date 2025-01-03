import {Column, CreateDateColumn, Entity, PrimaryGeneratedColumn} from "typeorm";

@Entity('user_token')
export class EntityUserToken {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({type: 'varchar', nullable: false})
    user_id: string;

    @Column({type: 'varchar', nullable: false})
    token: string;

    @Column({type: 'varchar', nullable: false})
    ip_address: string;

    @CreateDateColumn({type: 'timestamp'})
    created_at: Date;
}

@Entity('otp')
export class EntityOtpData {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({type: 'varchar', nullable: false})
    user_id: string;

    @Column({type: 'varchar', nullable: false})
    data: string;

    @Column({type: 'int', nullable: false})
    code: number;

    @Column({type: 'varchar', nullable: true})
    type: string;

    @CreateDateColumn({type: 'timestamp'})
    created_at: Date;
}