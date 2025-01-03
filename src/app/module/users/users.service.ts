import {getMetadataArgsStorage, Repository} from "typeorm";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import "dayjs/locale/id";

import {CreateNameFromEmail, CreateSlug, GenerateRandomNumber, ToCamelCase} from "@/lib/helper/common";
import {CustomHttpExceptionError} from "@/lib/helper/customError";
import {UploadFile} from "@/lib/storage/uploader";
import MetaPagination from "@/lib/helper/pagination";

import {EntityUser} from "./users.model";
import {EntityUserData} from "@/app/module/users/userData.model";
import {UserDto} from "@/app/module/users/users.dto";
import {FilterUser} from "@/lib/types/filters/user";
import {User} from "@/lib/types/data/user";
import ConvertPermissionsFromDatabase from "@/lib/helper/permissionHandler";

dayjs.extend(utc);
dayjs.extend(timezone);

// Set the locale to Indonesian
dayjs.locale('id');
// Assuming you want to convert to a specific timezone (e.g., 'Asia/Jakarta')
const TIMEZONE = 'Asia/Jakarta';

export class UserService {
    constructor(
        private readonly userRepository: Repository<EntityUser>,
        private readonly userDataRepository: Repository<EntityUserData>
    ) {
    }

    async GetAll(page: number, limit: number, sortBy: string, order: "ASC" | "DESC", filter: FilterUser) {
        const queryBuilder = this.userRepository.createQueryBuilder('user');
        queryBuilder.select([
            'user.id',
            'user.email',
            'user.username',
            'user.password',
            'user.pin',
            'user.referral_code',
            'user.type',
            'user.status',
            'user.created_at',
            'user.updated_at',
            'user.role_id',
            'role.name AS role',
            'role.permissions',
            'role.access',
            'role.is_default',
            'user_data.id',
            'user_data.name',
            'user_data.profile',
            'user_data.province',
            'user_data.city',
            'user_data.district',
        ])
            .leftJoin('user.role', 'role') // Join the Role table
            .leftJoin('user.user_data', 'user_data') // Correctly join the user_data table
            .orderBy(`user.${sortBy}`, order)
            .where('user.deleted_at IS NULL');

        if (filter.name) {
            queryBuilder.andWhere('LOWER(user.name) LIKE LOWER(:name)', {name: `%${filter.name.toLowerCase()}%`});
        }

        if (filter.email) {
            queryBuilder.andWhere('LOWER(user.email) LIKE LOWER(:email)', {email: `%${filter.email.toLowerCase()}%`});
        }

        const [users, total] = await queryBuilder.skip((page - 1) * limit).take(limit).getManyAndCount();

        const formattedUsers = users.map((user) => ({
            ...user,
            created_at: dayjs(user.created_at).tz(TIMEZONE).locale('id').format('D MMMM YYYY HH:mm'),
        }));

        return {
            list: formattedUsers,
            meta: MetaPagination(page, limit, total)
        };
    }

    async GetUserByParams(params: { [key: string]: any }, matchType: 'AND' | 'OR' = 'AND'): Promise<User | null> {
        const queryBuilder = this.userRepository.createQueryBuilder('user');

        // Dynamically build the where condition based on the params object
        const whereConditions: string[] = [];
        const parameters: { [key: string]: any } = [];

        // Recursive function to handle nested objects
        const buildWhereConditions = (obj: { [key: string]: any }, prefix: string = '') => {
            for (const [key, value] of Object.entries(obj)) {
                const field = prefix ? `${prefix}.${key}` : key;
                if (typeof value === 'object' && value !== null) {
                    // Recursively handle nested objects
                    buildWhereConditions(value, field);
                } else {
                    whereConditions.push(`${field} = :${field}`);
                    parameters[field] = value;
                }
            }
        };

        // Build conditions for the main params object
        buildWhereConditions(params);

        // Join the conditions based on the matchType (AND or OR)
        const whereClause = whereConditions.join(` ${matchType} `);

        // Perform the query with the dynamic where conditions
        const user: EntityUser = await queryBuilder
            .select([
                'user.id',
                'user.email',
                'user.username',
                'user.password',
                'user.pin',
                'user.referral_code',
                'user.type',
                'user.status',
                'user.created_at',
                'user.updated_at',
                'user.role_id',
                'role.name AS role_name',
                'role.permissions',
                'role.access',
                'role.is_default',
                'user_data.id',
                'user_data.name',
                'user_data.profile',
                'user_data.province',
                'user_data.city',
                'user_data.district',
                'user_data.phone',  // Include phone from user_data
            ])
            .leftJoin('user.role', 'role') // Join the Role table
            .leftJoin('user.user_data', 'user_data') // Join the user_data table
            .where(whereClause, parameters)
            .getOne();

        if (!user) return null;

        // Map the raw result to the User object structure
        return {
            ...user,
            user_data: {
                ...user.user_data,
                province: await ToCamelCase(user.user_data.province || null),
                city: await ToCamelCase(user.user_data.city || null),
                district: await ToCamelCase(user.user_data.district || null),
                phone: user.user_data.phone, // Include phone from user_data
            },
            role: {
                ...user.role,
                permissions: ConvertPermissionsFromDatabase(user.role.permissions),
                created_at: new Date(user.role.updated_at),
                updated_at: new Date(user.role.updated_at),
                deleted_at: new Date(user.role.updated_at),
            },
            created_at: new Date(user.updated_at),
        };
    }


    async Create(data: UserDto): Promise<User | null> {
        // Get the query runner from the user repository's manager
        const queryRunner = this.userRepository.manager.connection.createQueryRunner();

        // Start a transaction
        await queryRunner.startTransaction();

        try {
            // Check if the user already exists by email
            let user: EntityUser = await queryRunner.manager.findOne(EntityUser, {
                where: {email: data.email},
                relations: ['user_data'], // Make sure to load the related user_data
            });

            // Check if payload had type, if not, set user.type to 0
            if (!data.type) {
                data.type = 0;
            }

            // Check if payload had status, if not, set user.status to 0
            if (!data.status) {
                data.status = 0;
            }

            // Check if payload had status, if not, set user.status to 0
            if (!data.username) {
                data.username = await CreateSlug(await CreateNameFromEmail(data.email) + "-" + await GenerateRandomNumber(4));
            }

            // referral code get 4 letter from name and 2 random number like "MAHN14"
            if (!data.referral_code) {
                data.referral_code = data.username.slice(0, 4) + await GenerateRandomNumber(2);
            }

            // If the user exists
            if (user) {
                // If the user is active, throw an error
                if (user.status === 1) {
                    throw new CustomHttpExceptionError("Email already registered", 400); // Email already registered
                }
                // Update the user data
                Object.assign(user, data);
            } else {
                // If the user does not exist, create a new user
                user = queryRunner.manager.create(EntityUser, data);
            }

            // Save the user first to generate the user.id
            user = await queryRunner.manager.save(EntityUser, user);

            let userData = user.user_data;

            // If user_data does not exist, create a new one
            if (!userData) {
                userData = queryRunner.manager.create(EntityUserData, {
                    user_id: user.id, // Ensure user.id is available here
                    profile: "https://ui-avatars.com/api/?background=random&name=N",
                    phone: data.phone,
                    name: await CreateNameFromEmail(user.email),
                });
            } else {
                // If user_data exists, update it with the new data
                Object.assign(userData, {
                    phone: data.phone,
                    name: await CreateNameFromEmail(user.email),
                });
            }

            // Save user data first to ensure the relation is maintained
            await queryRunner.manager.save(EntityUserData, userData);

            // Commit the transaction
            await queryRunner.commitTransaction();

            // get user from getByParams
            // Return the updated user
            return await this.GetUserByParams({email: user.email});
        } catch (error) {
            // Rollback the transaction in case of error
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            // Release the query runner
            await queryRunner.release();
        }
    }

    async Update(id: string, data: UserDto) {
        const queryRunner = this.userRepository.manager.connection.createQueryRunner();
        await queryRunner.startTransaction();

        try {
            const user = await this.userRepository.findOneBy({id});
            if (!user) throw new CustomHttpExceptionError(`User not found with id ${id}`, 404);

            if (!user.username) {
                data.username = await CreateSlug(await CreateNameFromEmail(user.email) + "-" + await GenerateRandomNumber(4));
            }

            /**
             * UPDATE USER PROFILE
             */
            Object.assign(user, data);
            await queryRunner.manager.save(EntityUser, user);

            await queryRunner.commitTransaction();
            return {
                data: user,
                message: "User profile updated successfully"
            };
        } catch (error) {
            // Rollback transaction in case of an error
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            // Release the query runner
            await queryRunner.release();
        }
    }

    async UpdateUserPatch(id: string, data: Record<string, any>) {
        const queryRunner = this.userRepository.manager.connection.createQueryRunner();
        await queryRunner.startTransaction();

        try {
            // Fetch the user and include user_data relation
            const user = await queryRunner.manager.findOne(EntityUser, {where: {id}, relations: ['user_data']});
            if (!user) throw new CustomHttpExceptionError(`User not found with id ${id}`, 404);

            // Get columns dynamically from the metadata
            const userColumns = getMetadataArgsStorage()
                .columns.filter((col) => col.target === EntityUser)
                .map((col) => col.propertyName);

            const userDataColumns = getMetadataArgsStorage()
                .columns.filter((col) => col.target === EntityUserData)
                .map((col) => col.propertyName);

            // Separate fields for EntityUser and EntityUserData
            const userUpdates = Object.fromEntries(
                Object.entries(data).filter(([key]) => userColumns.includes(key))
            );

            const userDataUpdates = Object.fromEntries(
                Object.entries(data).filter(([key]) => userDataColumns.includes(key))
            );

            // Update EntityUser fields
            Object.assign(user, userUpdates);

            // Update EntityUserData fields
            if (Object.keys(userDataUpdates).length > 0) {
                let userData = user.user_data;

                // Create a new user_data entity if it doesn't exist
                if (!userData) {
                    userData = new EntityUserData();
                    userData.user_id = user.id;
                }

                // Assign fields to user_data
                Object.assign(userData, userDataUpdates);

                // Save user_data
                await queryRunner.manager.save(EntityUserData, userData);
            }

            // Save the user entity
            await queryRunner.manager.save(EntityUser, user);

            // Commit transaction
            await queryRunner.commitTransaction();

            // Fetch updated user data
            const userData = await this.GetUserByParams({email: user.email});

            return {
                data: userData,
                message: "User profile updated successfully",
            };
        } catch (error) {
            // Rollback transaction in case of an error
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            // Release the query runner
            await queryRunner.release();
        }
    }

    async UploadPhoto(id: string, file: Express.Multer.File) {
        const existUser = await this.userRepository.findOneBy({id});
        if (!existUser) throw new CustomHttpExceptionError('User not found', 404)
        const imageUrl = await UploadFile(file);
        return await this.userDataRepository.update(existUser.id, {profile: imageUrl});
    }

    async Delete(id: string): Promise<{ affected?: number }> {
        return this.userRepository.softDelete(id);
    }
}