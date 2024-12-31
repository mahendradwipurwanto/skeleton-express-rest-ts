import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn
} from "typeorm";
import {EntityRole} from "@/app/module/role/role.model";
import {EntityUserData} from "@/app/module/users/userData.model";

@Entity('users')
export class EntityUser {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({type: 'varchar', length: 100, unique: true, nullable: false})
    email: string;

    @Column({type: 'varchar', length: 100, unique: true, nullable: false})
    username: string;

    @Column({type: 'varchar', length: 255, nullable: false})
    password: string;

    @Column({type: 'int', nullable: false})
    pin: number;

    @Column({type: 'uuid', nullable: false})
    role_id: string;

    @ManyToOne(() => EntityRole, (role) => role.users, {eager: true})
    @JoinColumn({name: 'role_id'})
    role: EntityRole;

    @Column({type: 'varchar', length: 10, unique: true, nullable: false})
    referral_code: string;

    @Column({
        type: 'int',
        default: 0,
        nullable: false,
        comment: "0: regular, 1: google, 2: facebook"
    })
    type: number;

    @Column({
        type: 'int',
        default: 0,
        nullable: false,
        comment: "0: pending, 1: active/verified, 2: suspended (30 days), 3: deactivated/unverified"
    })
    status: number;

    @CreateDateColumn({type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', nullable: false})
    created_at: Date;

    @UpdateDateColumn({type: 'timestamp', nullable: true})
    updated_at: Date;

    @OneToOne(() => EntityUserData, (userData) => userData.user)
    @JoinColumn({name: 'id', referencedColumnName: 'user_id'})
    user_data: EntityUserData; // One-to-one relation with UserData
}