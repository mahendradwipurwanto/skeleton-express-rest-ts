import {Repository} from "typeorm";
import {EntityRole} from "./role.model";

export class RoleService {
    constructor(
        private readonly roleRepository: Repository<EntityRole>
    ) {
    }

    async GetAll(limit: number) {
        const queryBuilder = this.roleRepository.createQueryBuilder('role')
        queryBuilder.select([
            'role.id',
            'role.name',
            'role.permissions',
            'role.access',
            'role.is_default',
            'role.parent_id',
            'role.created_at',
            'role.updated_at',
            'role.deleted_at'
        ])
            .orderBy('role.name', 'DESC')

        if (limit) {
            queryBuilder.limit(limit);
        }

        const [roles, total] = await queryBuilder.getManyAndCount();
        return {
            roles,
            total
        }
    }

    async GetById(Id: string) {
        const queryBuilder = this.roleRepository.createQueryBuilder('role')
        queryBuilder.select([
            'role.id',
            'role.name',
            'role.permissions',
            'role.access',
            'role.is_default',
            'role.parent_id',
            'role.created_at',
            'role.updated_at',
            'role.deleted_at'
        ])
            .where('role.id = :Id', {Id})
            .orderBy('role.name', 'DESC')

        return await queryBuilder.getOne();
    }

    async GetDefaultRole() {
        const queryBuilder = this.roleRepository.createQueryBuilder('role')
        queryBuilder.select([
            'role.id',
            'role.name',
            'role.permissions',
            'role.access',
            'role.is_default',
            'role.parent_id',
            'role.created_at',
            'role.updated_at',
            'role.deleted_at'
        ])
            .where('role.is_default = :is_default', {is_default: true})

        return await queryBuilder.getOne();
    }
}