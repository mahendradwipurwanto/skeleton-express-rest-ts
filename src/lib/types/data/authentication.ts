import {Permission} from "./role";

export interface TokenData {
    id: string;
    email: string;
    name: string;
    role: string;
    permissions: Permission;
    date: string;
    expired: string;
}