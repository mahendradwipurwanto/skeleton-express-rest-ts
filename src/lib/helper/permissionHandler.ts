import { Permission, PermissionAccess } from "@/lib/types/data/role";

export default function ConvertPermissionsFromDatabase(dbPermissionsString: string): Permission {
    // Parse the string into an object
    const dbPermissions = JSON.parse(dbPermissionsString);

    // Helper function to transform actions into PermissionAccess[]
    const transformActions = (actions: Record<string, boolean>): PermissionAccess[] => {
        return Object.entries(actions).map(([key, access]) => ({
            key,
            access,
        }));
    };

    // Transform the database permissions into the Permission type
    const permissions: Permission = {};

    for (const [platform, entities] of Object.entries(dbPermissions)) {
        permissions[platform] = Object.entries(entities).map(([entity, actions]) => ({
            key: entity,
            access: transformActions(actions as Record<string, boolean>),
        }));
    }

    return permissions;
}