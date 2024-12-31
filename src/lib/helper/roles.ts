import {Permission, PermissionAccess} from "@/lib/types/data/role";

export async function TransformPermissionsAsync(permissions: any): Promise<Permission> {
    const transformAccess = (accessObj: any): PermissionAccess[] => {
        return Object.entries(accessObj).map(([key, value]) => ({
            key,
            access: Object.values(value).every(Boolean), // Combine all permissions into a single access boolean
        }));
    };

    return {
        mobile: transformAccess(permissions.mobile || {}),
        app: transformAccess(permissions.app || {}),
    };
}