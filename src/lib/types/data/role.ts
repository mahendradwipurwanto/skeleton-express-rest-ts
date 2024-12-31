export interface RoleData {
    id: string;
    name: string;
    permissions: Permission;
    access: number;
    is_default: boolean;
    parent_id: string;
    created_at: Date;
    updated_at: Date;
    deleted_at: Date;
}

export interface Permission {
    mobile?: PermissionAccess[];
    app?: PermissionAccess[];
}

export interface PermissionAccess {
    key: string;
    access: boolean;
}