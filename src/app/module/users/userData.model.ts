import {Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn} from "typeorm";
import {EntityUser} from "@/app/module/users/users.model";

@Entity('user_data')
export class EntityUserData {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({type: 'uuid', nullable: false})
    user_id: string;

    @Column({type: 'varchar', length: 255, nullable: true})
    profile: string;

    @Column({type: 'varchar', length: 20, nullable: true})
    phone: string;

    @Column({type: 'varchar', length: 100, nullable: true})
    name: string;

    @Column({type: 'varchar', length: 100, nullable: true})
    province: string;

    @Column({type: 'varchar', length: 100, nullable: true})
    city: string;

    @Column({type: 'varchar', length: 100, nullable: true})
    district: string;

    @OneToOne(() => EntityUser, (user) => user.user_data)
    @JoinColumn({name: 'user_id'})
    user: EntityUser;
}