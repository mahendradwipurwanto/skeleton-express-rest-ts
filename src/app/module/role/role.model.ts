import {
    Column,
    CreateDateColumn,
    DeleteDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn
} from "typeorm";
import {EntityUser} from "../users/users.model";

@Entity('roles')
export class EntityRole {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({type: 'varchar', length: 50, nullable: false})
    name: string;

    @Column({type: 'text', nullable: false})
    permissions: string;

    @Column({
        type: 'int',
        default: 3,
        nullable: false,
        comment: "0: all, 1: mobile, 2: admin, 3: website"
    })
    access: number;

    @Column({type: 'boolean', default: false, nullable: false})
    is_default: boolean;

    @Column({type: 'uuid', nullable: true})
    parent_id: string;

    @ManyToOne(() => EntityRole, (role) => role.children, {nullable: true})
    @JoinColumn({name: 'parent_id'})
    parent: EntityRole;

    @OneToMany(() => EntityRole, (role) => role.parent)
    children: EntityRole[];

    @CreateDateColumn({type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', nullable: false})
    created_at: Date;

    @UpdateDateColumn({type: 'timestamp', nullable: true})
    updated_at: Date;

    @DeleteDateColumn({type: 'timestamp', nullable: true})
    deleted_at: Date;

    @OneToMany(() => EntityUser, (user) => user.role)
    users: EntityUser[];
}