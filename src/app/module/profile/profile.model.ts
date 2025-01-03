import {
    Column,
    CreateDateColumn,
    DeleteDateColumn,
    Entity, JoinColumn, OneToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn
} from "typeorm";
import {EntityUser} from "../users/users.model";

@Entity('notifications')
export class EntityNotification  {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({type: 'uuid', nullable: false})
    user_id: string;

    @Column({type: 'uuid', nullable: false})
    reff_id: string;

    @Column({type: 'varchar', length: 25, nullable: true})
    reff_type: string;

    @Column({type: 'varchar', length: 100, nullable: false})
    title: string;

    @Column({type: 'varchar', length: 255, nullable: false})
    icon: string;

    @Column({type: 'text', nullable: false})
    notification: string;

    @CreateDateColumn({type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', nullable: false})
    created_at: Date;

    @UpdateDateColumn({type: 'timestamp', nullable: true})
    updated_at: Date;

    @DeleteDateColumn({type: 'timestamp', nullable: true})
    deleted_at: Date;

    @OneToOne(() => EntityUser, (user) => user.id)
    @JoinColumn({name: 'user_id', referencedColumnName: 'id'})
    user: EntityUser; // One-to-one relation with UserData
}