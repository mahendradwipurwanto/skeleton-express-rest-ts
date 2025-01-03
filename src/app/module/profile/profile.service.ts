import {Repository} from "typeorm";
import {EntityNotification} from "./profile.model";
import logger from "@/lib/helper/logger";

export class ProfileService {
    constructor(
        private readonly roleRepository: Repository<EntityNotification>
    ) {
    }

    async GetById(id: string, limit: number) {
        const queryBuilder = this.roleRepository.createQueryBuilder('notification')
        queryBuilder.select([
            'notification.id',
            'notification.user_id',
            'notification.reff_id',
            'notification.reff_type',
            'notification.title',
            'notification.icon',
            'notification.notification',
            'notification.created_at',
            'notification.updated_at',
            'notification.deleted_at',
            'user.*'
        ])
            .leftJoin('notification.user', 'user') // Correctly join the user_data table
            .where('notification.user_id = :user_id', {user_id: id})
            .orderBy('notification.created_at', 'DESC')

        logger.info(queryBuilder.getQuery());

        if (limit) {
            queryBuilder.limit(limit);
        }

        const [notifications, total] = await queryBuilder.getManyAndCount();
        return {
            notifications: notifications.length > 0 ? notifications : null,
            total
        }
    }
}